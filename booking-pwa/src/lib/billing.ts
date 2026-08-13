import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { extendMasterSubscription, type PlanId } from "@/lib/subscription";

export type BillingPlanId = "basic" | "pro";

export type BillingPlan = {
  id: BillingPlanId;
  label: string;
  price_rub: number;
  days: number;
  hint: string;
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

function periodDays(): number {
  const n = Number(process.env.BILLING_PERIOD_DAYS || "30");
  if (!Number.isFinite(n) || n < 1) return 30;
  return Math.min(366, Math.floor(n));
}

function priceRub(plan: BillingPlanId): number {
  const key =
    plan === "pro" ? "BILLING_PRO_PRICE_RUB" : "BILLING_BASIC_PRICE_RUB";
  const fallback = plan === "pro" ? 590 : 290;
  const n = Number(process.env[key] || fallback);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

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

export function listBillingPlans(): BillingPlan[] {
  const days = periodDays();
  return [
    {
      id: "basic",
      label: "Базовый",
      price_rub: priceRub("basic"),
      days,
      hint: "Онлайн-запись и уведомления на email",
    },
    {
      id: "pro",
      label: "Pro",
      price_rub: priceRub("pro"),
      days,
      hint: "Всё из Базового + приоритет поддержки",
    },
  ];
}

export function getBillingPlan(plan: string): BillingPlan | null {
  if (plan !== "basic" && plan !== "pro") return null;
  return listBillingPlans().find((p) => p.id === plan) || null;
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

  const plan = (payment.plan === "pro" ? "pro" : "basic") as PlanId;
  const info = extendMasterSubscription(payment.master_id, payment.days, {
    plan,
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
