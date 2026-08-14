import { getDb, withTransaction } from "@/lib/db";
import {
  isNotifyChannel,
  type NotifyChannel,
} from "@/lib/notify-channel";
import type { Master } from "@/lib/types";
import { rowToMaster } from "@/lib/auth";
import { extendMasterSubscription } from "@/lib/subscription";

export type AdminMasterRow = Master & {
  bookings_count: number;
};

export type AdminListQuery = {
  q?: string;
  status?: string;
  plan?: string;
  blocked?: "all" | "yes" | "no";
  sort?: "created_at" | "name" | "bookings" | "paid_until" | "status";
  order?: "asc" | "desc";
};

export function listMastersForAdmin(
  query: AdminListQuery = {}
): AdminMasterRow[] {
  const sort = query.sort || "created_at";
  const order = query.order === "asc" ? "ASC" : "DESC";
  const sortSql =
    sort === "name"
      ? `m.name COLLATE NOCASE ${order}`
      : sort === "bookings"
        ? `bookings_count ${order}`
        : sort === "paid_until"
          ? `m.paid_until ${order}`
          : sort === "status"
            ? `m.subscription_status ${order}`
            : `m.created_at ${order}`;

  const rows = getDb()
    .prepare(
      `SELECT m.*,
        (SELECT COUNT(*) FROM bookings b WHERE b.master_id = m.id) AS bookings_count
       FROM masters m
       ORDER BY ${sortSql}`
    )
    .all() as Record<string, unknown>[];

  let list = rows.map((row) => {
    const master = rowToMaster(row);
    return {
      ...master,
      blocked: Number(row.blocked || 0) === 1 || master.blocked,
      bookings_count: Number(row.bookings_count || 0),
    };
  });

  const q = (query.q || "").trim().toLowerCase();
  if (q) {
    list = list.filter((m) => {
      const hay = [m.name, m.slug, m.phone, m.notify_email]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }
  if (query.status && query.status !== "all") {
    list = list.filter((m) => m.subscription_status === query.status);
  }
  if (query.plan && query.plan !== "all") {
    list = list.filter((m) => m.plan === query.plan);
  }
  if (query.blocked === "yes") {
    list = list.filter((m) => m.blocked);
  } else if (query.blocked === "no") {
    list = list.filter((m) => !m.blocked);
  }

  return list;
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
  const master = rowToMaster(row);
  return {
    ...master,
    blocked: Number(row.blocked || 0) === 1 || master.blocked,
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

function purgeMasterRelated(database: ReturnType<typeof getDb>, masterId: string) {
  // Tables without reliable ON DELETE CASCADE in older DBs
  const tables = [
    "notification_outbox", // may not have master_id — skip
    "max_connect_codes",
    "vk_connect_codes",
    "telegram_connect_codes",
    "owner_alert_log",
    "payments",
    "reviews",
    "portfolio",
    "services",
    "bookings",
  ];
  for (const table of tables) {
    if (table === "notification_outbox") continue;
    try {
      database.prepare(`DELETE FROM ${table} WHERE master_id = ?`).run(masterId);
    } catch {
      /* table may not exist yet */
    }
  }
}

export function deleteMasterAsAdmin(
  id: string
): { ok: true } | { ok: false; error: string; status: number } {
  const existing = getMasterForAdmin(id);
  if (!existing) {
    return { ok: false, error: "Мастер не найден", status: 404 };
  }

  withTransaction((database) => {
    purgeMasterRelated(database, id);
    database.prepare("DELETE FROM masters WHERE id = ?").run(id);
  });

  return { ok: true };
}

/** Wipe all masters (test cleanup). Requires confirm phrase. */
export function deleteAllMastersAsAdmin(
  confirm: string
): { ok: true; deleted: number } | { ok: false; error: string; status: number } {
  if (confirm !== "DELETE_ALL") {
    return {
      ok: false,
      error: 'Для очистки введите подтверждение: DELETE_ALL',
      status: 400,
    };
  }

  const deleted = withTransaction((database) => {
    const count = (
      database.prepare("SELECT COUNT(*) AS c FROM masters").get() as {
        c: number;
      }
    ).c;
    const ids = database
      .prepare("SELECT id FROM masters")
      .all() as { id: string }[];
    for (const row of ids) {
      purgeMasterRelated(database, row.id);
    }
    database.prepare("DELETE FROM masters").run();
    return count;
  });

  return { ok: true, deleted };
}
