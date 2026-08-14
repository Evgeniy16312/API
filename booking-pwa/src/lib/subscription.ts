import { getDb } from "@/lib/db";
import {
  addCalendarMonths,
  getPlanCatalogEntry,
  type PaidPlanId,
} from "@/lib/plan-catalog";

/** Trial length from registration date (S0). */
export const TRIAL_DAYS = 14;

export type SubscriptionStatus = "trial" | "active" | "past_due" | "blocked";
export type PlanId = "trial" | "lite" | "basic" | "pro";

export type SubscriptionInfo = {
  plan: PlanId;
  subscription_status: SubscriptionStatus;
  paid_until: string;
  blocked: boolean;
  trial_ends_at: string;
  booking_allowed: boolean;
  /** Short Russian line for master panel banner. */
  banner: string | null;
};

function asPlan(value: unknown): PlanId {
  if (
    value === "basic" ||
    value === "pro" ||
    value === "trial" ||
    value === "lite"
  ) {
    return value;
  }
  return "trial";
}

function asStatus(value: unknown): SubscriptionStatus {
  if (
    value === "trial" ||
    value === "active" ||
    value === "past_due" ||
    value === "blocked"
  ) {
    return value;
  }
  return "trial";
}

function trialEndsAt(createdAt: string): Date {
  const start = new Date(createdAt);
  if (Number.isNaN(start.getTime())) {
    return new Date(Date.now() + TRIAL_DAYS * 86400_000);
  }
  return new Date(start.getTime() + TRIAL_DAYS * 86400_000);
}

function formatRuDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ru-RU");
}

/**
 * Recompute subscription status from dates; persist if changed.
 * Call from master me / booking create (lazy, no cron).
 */
export function syncMasterSubscription(masterId: string): SubscriptionInfo | null {
  const row = getDb()
    .prepare(
      `SELECT id, created_at, plan, subscription_status, paid_until, blocked
       FROM masters WHERE id = ?`
    )
    .get(masterId) as
    | {
        id: string;
        created_at: string;
        plan: string;
        subscription_status: string;
        paid_until: string;
        blocked: number;
      }
    | undefined;

  if (!row) return null;

  const plan = asPlan(row.plan);
  const blocked = Number(row.blocked) === 1;
  const paidUntil = row.paid_until || "";
  const trialEnd = trialEndsAt(row.created_at);
  const now = new Date();

  let status = asStatus(row.subscription_status);

  if (blocked) {
    status = "blocked";
  } else if (paidUntil) {
    const until = new Date(paidUntil);
    if (!Number.isNaN(until.getTime()) && until < now) {
      status = "past_due";
    } else if (!Number.isNaN(until.getTime()) && until >= now) {
      if (status !== "active") status = "active";
    }
  } else if (status === "trial" || status === "past_due" || status === "active") {
    if (trialEnd < now && status === "trial") {
      status = "past_due";
    }
  }

  if (status !== asStatus(row.subscription_status)) {
    getDb()
      .prepare("UPDATE masters SET subscription_status = ? WHERE id = ?")
      .run(status, masterId);
  }

  const booking_allowed = !blocked && status !== "past_due" && status !== "blocked";

  let banner: string | null = null;
  if (blocked || status === "blocked") {
    banner = "Аккаунт заблокирован. Онлайн-запись отключена.";
  } else if (status === "past_due") {
    banner =
      "Подписка истекла — онлайн-запись недоступна. Оплатите тариф в разделе «Подписка».";
  } else if (status === "trial") {
    banner = `Пробный период до ${formatRuDate(trialEnd.toISOString())}`;
  } else if (status === "active" && paidUntil) {
    banner = `Подписка активна до ${formatRuDate(paidUntil)}`;
  }

  return {
    plan,
    subscription_status: status,
    paid_until: paidUntil,
    blocked,
    trial_ends_at: trialEnd.toISOString(),
    booking_allowed,
    banner,
  };
}

/** Свой дизайн публичной страницы — только активный Pro. */
export function canCustomizePageTheme(
  info: SubscriptionInfo | null | undefined
): boolean {
  return Boolean(info && info.plan === "pro" && info.booking_allowed);
}

/** Напоминания 24ч/2ч — не на тарифе Старт. Trial как Стандарт. */
export function planHasReminders(plan: PlanId | undefined): boolean {
  return plan === "trial" || plan === "basic" || plan === "pro";
}

/** Лимит записей в день; trial = как Стандарт. null = без лимита. */
export function dailyBookingLimitForPlan(
  plan: PlanId | undefined
): number | null {
  if (plan === "pro") return null;
  if (plan === "basic" || plan === "trial") return 10;
  if (plan === "lite") return 3;
  return 3;
}

export function countMasterBookingsOnDate(
  masterId: string,
  date: string
): number {
  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS c FROM bookings
       WHERE master_id = ? AND date = ? AND status != 'cancelled'`
    )
    .get(masterId, date) as { c: number };
  return Number(row?.c) || 0;
}

export function dailyBookingLimitError(plan: PlanId): string {
  const limit = dailyBookingLimitForPlan(plan);
  if (limit === null) return "";
  const entry = getPlanCatalogEntry(plan === "trial" ? "basic" : plan);
  const name = entry?.name || "тариф";
  if (plan === "lite") {
    return `На тарифе «Старт» — до ${limit} заказов в день. Перейдите на «Стандарт» или «Премиум».`;
  }
  return `Лимит ${limit} заказов в день на тарифе «${name}». Перейдите на «Премиум» для снятия лимита.`;
}

export function portfolioLimitForPlan(plan: PlanId | undefined): number {
  if (plan === "pro") return 100;
  if (plan === "basic" || plan === "trial") return 20;
  return 5;
}

export function isMasterBookingAllowed(masterId: string): boolean {
  const info = syncMasterSubscription(masterId);
  return info?.booking_allowed ?? false;
}

/** Lazy batch for cron — keep statuses fresh without a separate worker. */
export function syncAllMasterSubscriptions(limit = 200): {
  checked: number;
  updated: number;
} {
  const rows = getDb()
    .prepare(
      `SELECT id, subscription_status FROM masters
       ORDER BY created_at ASC LIMIT ?`
    )
    .all(limit) as { id: string; subscription_status: string }[];

  let updated = 0;
  for (const row of rows) {
    const before = row.subscription_status;
    const info = syncMasterSubscription(row.id);
    if (info && info.subscription_status !== before) updated += 1;
  }
  return { checked: rows.length, updated };
}

export function extendMasterSubscription(
  masterId: string,
  options?: { plan?: PlanId; months?: number; days?: number }
): SubscriptionInfo | null {
  const existing = syncMasterSubscription(masterId);
  if (!existing) return null;

  const base =
    existing.paid_until && new Date(existing.paid_until) > new Date()
      ? new Date(existing.paid_until)
      : new Date();

  let until: Date;
  if (options?.months && options.months > 0) {
    until = addCalendarMonths(base, options.months);
  } else if (options?.days && options.days > 0) {
    until = new Date(base.getTime() + options.days * 86400_000);
  } else {
    until = addCalendarMonths(base, 1);
  }

  const nextPlan: PlanId =
    options?.plan === "basic" ||
    options?.plan === "pro" ||
    options?.plan === "lite"
      ? options.plan
      : existing.plan === "trial"
        ? "basic"
        : existing.plan;

  getDb()
    .prepare(
      `UPDATE masters
       SET paid_until = ?, subscription_status = 'active', plan = ?, blocked = 0
       WHERE id = ?`
    )
    .run(until.toISOString(), nextPlan, masterId);

  return syncMasterSubscription(masterId);
}
