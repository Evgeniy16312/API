import { getDb } from "@/lib/db";
import {
  isNotifyChannel,
  type NotifyChannel,
} from "@/lib/notify-channel";
import type { Master } from "@/lib/types";
import { rowToMaster } from "@/lib/auth";
import { extendMasterSubscription } from "@/lib/subscription";

export type AdminMasterRow = Master & {
  blocked: boolean;
  plan: string;
  subscription_status: string;
  paid_until: string;
  bookings_count: number;
};

export function listMastersForAdmin(): AdminMasterRow[] {
  const rows = getDb()
    .prepare(
      `SELECT m.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.master_id = m.id) AS bookings_count
       FROM masters m
       ORDER BY m.created_at DESC`
    )
    .all() as Record<string, unknown>[];

  return rows.map((row) => ({
    ...rowToMaster(row),
    blocked: Number(row.blocked || 0) === 1,
    plan: String(row.plan || "trial"),
    subscription_status: String(row.subscription_status || "trial"),
    paid_until: String(row.paid_until || ""),
    bookings_count: Number(row.bookings_count || 0),
  }));
}

export function getMasterForAdmin(id: string): AdminMasterRow | null {
  const row = getDb()
    .prepare(
      `SELECT m.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.master_id = m.id) AS bookings_count
       FROM masters m WHERE m.id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    ...rowToMaster(row),
    blocked: Number(row.blocked || 0) === 1,
    plan: String(row.plan || "trial"),
    subscription_status: String(row.subscription_status || "trial"),
    paid_until: String(row.paid_until || ""),
    bookings_count: Number(row.bookings_count || 0),
  };
}

export type AdminMasterPatch = {
  notify_channel?: NotifyChannel;
  notify_email?: string;
  plan?: string;
  subscription_status?: string;
  paid_until?: string;
  blocked?: boolean;
  /** Quick renew: extend paid_until by N days and set active. */
  extend_days?: number;
};

const PLANS = new Set(["trial", "basic", "pro"]);
const STATUSES = new Set(["trial", "active", "past_due", "blocked"]);

export function patchMasterAsAdmin(
  id: string,
  patch: AdminMasterPatch
): { ok: true; master: AdminMasterRow } | { ok: false; error: string; status: number } {
  const existing = getMasterForAdmin(id);
  if (!existing) {
    return { ok: false, error: "Мастер не найден", status: 404 };
  }

  if (patch.extend_days !== undefined) {
    const days = Number(patch.extend_days);
    if (!Number.isFinite(days) || days < 1 || days > 366) {
      return { ok: false, error: "extend_days: 1–366", status: 400 };
    }
    extendMasterSubscription(id, days);
    return { ok: true, master: getMasterForAdmin(id)! };
  }

  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (patch.notify_channel !== undefined) {
    if (!isNotifyChannel(patch.notify_channel)) {
      return { ok: false, error: "Неизвестный канал", status: 400 };
    }
    fields.push("notify_channel = ?");
    values.push(patch.notify_channel);
  }
  if (patch.notify_email !== undefined) {
    const email = String(patch.notify_email || "")
      .trim()
      .toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { ok: false, error: "Некорректный email", status: 400 };
    }
    fields.push("notify_email = ?");
    values.push(email);
  }
  if (patch.plan !== undefined) {
    if (!PLANS.has(patch.plan)) {
      return { ok: false, error: "Неизвестный план", status: 400 };
    }
    fields.push("plan = ?");
    values.push(patch.plan);
  }
  if (patch.subscription_status !== undefined) {
    if (!STATUSES.has(patch.subscription_status)) {
      return { ok: false, error: "Неизвестный статус подписки", status: 400 };
    }
    fields.push("subscription_status = ?");
    values.push(patch.subscription_status);
  }
  if (patch.paid_until !== undefined) {
    fields.push("paid_until = ?");
    values.push(String(patch.paid_until || ""));
  }
  if (patch.blocked !== undefined) {
    fields.push("blocked = ?");
    values.push(patch.blocked ? 1 : 0);
    if (patch.blocked) {
      fields.push("subscription_status = ?");
      values.push("blocked");
    }
  }

  if (fields.length === 0) {
    return { ok: false, error: "Нет данных для обновления", status: 400 };
  }

  values.push(id);
  getDb()
    .prepare(`UPDATE masters SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  const master = getMasterForAdmin(id)!;
  return { ok: true, master };
}
