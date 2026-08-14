import { getDb } from "./db";
import { parseSchedule } from "./db";
import { parseStoredPageTheme } from "./page-theme";
import { readSessionToken } from "./session";
import type { Master } from "./types";

export function getMasterByToken(token: string): Master | null {
  const row = getDb()
    .prepare("SELECT * FROM masters WHERE token = ?")
    .get(token) as Record<string, unknown> | undefined;

  if (!row) return null;
  return rowToMaster(row);
}

export function getMasterBySlug(slug: string): Master | null {
  const row = getDb()
    .prepare("SELECT * FROM masters WHERE slug = ?")
    .get(slug) as Record<string, unknown> | undefined;

  if (!row) return null;
  return rowToMaster(row);
}

export function getMasterById(id: string): Master | null {
  const row = getDb()
    .prepare("SELECT * FROM masters WHERE id = ?")
    .get(id) as Record<string, unknown> | undefined;

  if (!row) return null;
  return rowToMaster(row);
}

export function rowToMaster(row: Record<string, unknown>): Master {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    phone: row.phone as string,
    specialty: (row.specialty as string) || "",
    address: (row.address as string) || "",
    lat: typeof row.lat === "number" ? row.lat : row.lat != null ? Number(row.lat) : null,
    lng: typeof row.lng === "number" ? row.lng : row.lng != null ? Number(row.lng) : null,
    description: (row.description as string) || "",
    avatar_url: (row.avatar_url as string) || "",
    max_user_id: (row.max_user_id as string) || "",
    vk_user_id: (row.vk_user_id as string) || "",
    telegram_user_id: (row.telegram_user_id as string) || "",
    notify_channel:
      row.notify_channel === "vk" ||
      row.notify_channel === "max" ||
      row.notify_channel === "telegram" ||
      row.notify_channel === "email"
        ? row.notify_channel
        : "email",
    notify_email: (row.notify_email as string) || "",
    plan:
      row.plan === "basic" ||
      row.plan === "pro" ||
      row.plan === "trial" ||
      row.plan === "lite"
        ? row.plan
        : "trial",
    subscription_status:
      row.subscription_status === "active" ||
      row.subscription_status === "past_due" ||
      row.subscription_status === "blocked" ||
      row.subscription_status === "trial"
        ? row.subscription_status
        : "trial",
    paid_until: (row.paid_until as string) || "",
    blocked: Number(row.blocked || 0) === 1,
    work_schedule: parseSchedule(row.work_schedule as string),
    slot_duration: (row.slot_duration as number) || 60,
    created_at: row.created_at as string,
    page_theme: parseStoredPageTheme(row.page_theme),
  };
}

/** Bearer first, then httpOnly session cookie. */
export function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return readSessionToken(request);
}

export function requireAuth(request: Request): Master | null {
  const token = extractToken(request);
  if (!token) return null;
  return getMasterByToken(token);
}
