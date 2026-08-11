import { getDb } from "./db";
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
    description: (row.description as string) || "",
    avatar_url: (row.avatar_url as string) || "",
    max_user_id: (row.max_user_id as string) || "",
    vk_user_id: (row.vk_user_id as string) || "",
    work_schedule: JSON.parse(row.work_schedule as string),
    slot_duration: (row.slot_duration as number) || 60,
    created_at: row.created_at as string,
  };
}

export function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
  return null;
}

export function requireAuth(request: Request): Master | null {
  const token = extractToken(request);
  if (!token) return null;
  return getMasterByToken(token);
}
