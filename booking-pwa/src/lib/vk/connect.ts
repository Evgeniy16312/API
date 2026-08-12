import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";

const CODE_TTL_MS = 15 * 60 * 1000;

export function createVkConnectCode(masterId: string): string {
  const code = randomBytes(3).toString("hex").toUpperCase();
  const now = new Date();
  const expires = new Date(now.getTime() + CODE_TTL_MS);

  getDb()
    .prepare(
      `INSERT INTO vk_connect_codes (code, master_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(code, masterId, expires.toISOString(), now.toISOString());

  return code;
}

export function linkVkUser(
  code: string,
  vkUserId: string
): { ok: boolean; masterName?: string; error?: string } {
  const row = getDb()
    .prepare("SELECT * FROM vk_connect_codes WHERE code = ? AND used = 0")
    .get(code.toUpperCase()) as
    | { master_id: string; expires_at: string }
    | undefined;

  if (!row) {
    return { ok: false, error: "Код не найден или уже использован" };
  }

  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: "Код истёк. Получите новый в приложении." };
  }

  const master = getDb()
    .prepare("SELECT id, name FROM masters WHERE id = ?")
    .get(row.master_id) as { id: string; name: string } | undefined;

  if (!master) {
    return { ok: false, error: "Мастер не найден" };
  }

  getDb()
    .prepare("UPDATE masters SET vk_user_id = ? WHERE id = ?")
    .run(String(vkUserId), master.id);

  getDb()
    .prepare(
      "UPDATE vk_connect_codes SET used = 1, vk_user_id = ? WHERE code = ?"
    )
    .run(String(vkUserId), code.toUpperCase());

  return { ok: true, masterName: master.name };
}

export function getVkConnectStatus(masterId: string) {
  const master = getDb()
    .prepare("SELECT vk_user_id FROM masters WHERE id = ?")
    .get(masterId) as { vk_user_id: string } | undefined;

  const pending = getDb()
    .prepare(
      `SELECT code, expires_at FROM vk_connect_codes
       WHERE master_id = ? AND used = 0 AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(masterId, new Date().toISOString()) as
    | { code: string; expires_at: string }
    | undefined;

  return {
    connected: Boolean(master?.vk_user_id),
    vk_user_id: master?.vk_user_id || "",
    pending_code: pending?.code || null,
    code_expires_at: pending?.expires_at || null,
  };
}
