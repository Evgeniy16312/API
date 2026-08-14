import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import {
  BILLING_PERIOD_LABEL,
  getPlanCatalogEntry,
  listPlanCatalog,
  type PaidPlanId,
} from "@/lib/plan-catalog";
import { extendMasterSubscription, type PlanId } from "@/lib/subscription";

export type BillingPlanId = PaidPlanId;

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  title: string;
  label: string;
  price_rub: number;
  period_label: string;
  daily_orders: number | null;
  daily_orders_label: string;
  tagline: string;
  highlights: string[];
  features: string[];
  excludes: string[];
};

export type PaymentRow = {
  id: string;
  master_id: string;
  plan: string;
  amount_rub: number;
  days: number;
  status: string;
  provider: string;
  external_id: string;
  confirmation_url: string;
  created_at: string;
  paid_at: string;
};

export function isBillingMock(): boolean {
  return (
    process.env.BILLING_MOCK === "1" ||
    process.env.BILLING_MOCK === "true"
  );
}

export function isYookassaConfigured(): boolean {
  return Boolean(
    process.env.YOOKASSA_SHOP_ID?.trim() &&
      process.env.YOOKASSA_SECRET_KEY?.trim()
  );
}

export type BillingMode = "mock" | "yookassa" | "transfer";

/** Pilot: transfer by default until ЮKassa keys are set. */
export function getBillingMode(): BillingMode {
  if (isBillingMock()) return "mock";
  const forced = (process.env.BILLING_MODE || "").trim().toLowerCase();
  if (forced === "transfer" || forced === "manual") return "transfer";
  if (forced === "yookassa") return "yookassa";
  if (isYookassaConfigured()) return "yookassa";
  return "transfer";
}

export type ManualTransferInfo = {
  phone: string;
  bank: string;
  recipient: string;
  support: string;
  note: string;
};

export function getManualTransferInfo(): ManualTransferInfo {
  return {
    phone: process.env.BILLING_TRANSFER_PHONE?.trim() || "",
    bank: process.env.BILLING_TRANSFER_BANK?.trim() || "СБП / любой банк",
    recipient: process.env.BILLING_TRANSFER_NAME?.trim() || "МояЗапись",
    support:
      process.env.BILLING_SUPPORT_CONTACT?.trim() ||
      process.env.ADMIN_NOTIFY_EMAIL?.trim() ||
      "moyazapis@mail.ru",
    note:
      process.env.BILLING_TRANSFER_NOTE?.trim() ||
      "После перевода напишите в поддержку — продлим доступ вручную.",
  };
}

export function paymentCommentForMaster(slug: string, planId: string): string {
  return `MZ ${slug} ${planId}`.slice(0, 40);
}

function toBillingPlan(entry: NonNullable<ReturnType<typeof getPlanCatalogEntry>>): BillingPlan {
  return {
    id: entry.id,
    name: entry.name,
    title: entry.title,
    label: entry.title,
    price_rub: entry.price_rub,
    period_label: BILLING_PERIOD_LABEL,
    daily_orders: entry.daily_orders,
    daily_orders_label: entry.daily_orders_label,
    tagline: entry.tagline,
    highlights: entry.highlights,
    features: entry.features,
    excludes: entry.excludes,
  };
}

export function listBillingPlans(): BillingPlan[] {
  return listPlanCatalog().map((entry) => toBillingPlan(entry));
}

export function getBillingPlan(plan: string): BillingPlan | null {
  const entry = getPlanCatalogEntry(plan);
  if (!entry) return null;
  return toBillingPlan(entry);
}

function newId(): string {
  return randomBytes(16).toString("hex");
}

export function insertPendingPayment(input: {
  masterId: string;
  plan: BillingPlanId;
  amountRub: number;
  days: number;
  provider: string;
  externalId?: string;
  confirmationUrl?: string;
}): PaymentRow {
  const id = newId();
  const created_at = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO payments (
        id, master_id, plan, amount_rub, days, status, provider,
        external_id, confirmation_url, created_at, paid_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, '')`
    )
    .run(
      id,
      input.masterId,
      input.plan,
      input.amountRub,
      input.days,
      input.provider,
      input.externalId || "",
      input.confirmationUrl || "",
      created_at
    );
  return getPaymentById(id)!;
}

export function updatePaymentExternal(
  id: string,
  externalId: string,
  confirmationUrl: string
): void {
  getDb()
    .prepare(
      `UPDATE payments SET external_id = ?, confirmation_url = ? WHERE id = ?`
    )
    .run(externalId, confirmationUrl, id);
}

export function getPaymentById(id: string): PaymentRow | null {
  const row = getDb()
    .prepare("SELECT * FROM payments WHERE id = ?")
    .get(id) as PaymentRow | undefined;
  return row || null;
}

export function getPaymentByExternalId(externalId: string): PaymentRow | null {
  if (!externalId) return null;
  const row = getDb()
    .prepare("SELECT * FROM payments WHERE external_id = ?")
    .get(externalId) as PaymentRow | undefined;
  return row || null;
}

/**
 * Mark payment paid and extend subscription. Idempotent if already paid.
 */
export function applySuccessfulPayment(
  paymentId: string,
  externalId?: string
): { ok: true; payment: PaymentRow } | { ok: false; error: string } {
  const payment = getPaymentById(paymentId);
  if (!payment) return { ok: false, error: "Платёж не найден" };

  if (payment.status === "paid") {
    return { ok: true, payment };
  }

  if (payment.status !== "pending" && payment.status !== "waiting") {
    return { ok: false, error: "Платёж нельзя подтвердить" };
  }

  const paid_at = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE payments
       SET status = 'paid', paid_at = ?,
           external_id = CASE WHEN ? != '' THEN ? ELSE external_id END
       WHERE id = ?`
    )
    .run(paid_at, externalId || "", externalId || "", paymentId);

  const plan = (
    payment.plan === "pro"
      ? "pro"
      : payment.plan === "lite"
        ? "lite"
        : "basic"
  ) as PlanId;
  const info = extendMasterSubscription(payment.master_id, {
    plan,
    months: 1,
  });
  if (!info) return { ok: false, error: "Мастер не найден" };

  return { ok: true, payment: getPaymentById(paymentId)! };
}

export function markPaymentCanceled(paymentId: string): void {
  getDb()
    .prepare(
      `UPDATE payments SET status = 'canceled' WHERE id = ? AND status = 'pending'`
    )
    .run(paymentId);
}

export function appBaseUrl(request?: Request): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (request) {
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "http://localhost:3000";
}
