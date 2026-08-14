import { randomBytes } from "node:crypto";
import { rowToMaster } from "./auth";
import { getDb, sqlGet } from "./db";
import { sendPlainEmail } from "./notifications";
import { getServerAppUrl } from "./public-url";
import type { Master } from "./types";
import { normalizeLoginEmail } from "./validate";

const RESET_TTL_MS = 60 * 60 * 1000;

type MasterAuthRow = {
  id: string;
  token: string;
  login_email: string;
  password_hash: string;
};

export function getMasterByLoginEmail(email: string): Master | null {
  const normalized = normalizeLoginEmail(email);
  if (!normalized) return null;

  const row = sqlGet<Record<string, unknown>>(
    "SELECT * FROM masters WHERE login_email = ?",
    normalized
  );
  if (!row) return null;
  return rowToMaster(row);
}

export function getMasterAuthByLoginEmail(
  email: string
): (MasterAuthRow & Master) | null {
  const normalized = normalizeLoginEmail(email);
  if (!normalized) return null;

  const row = sqlGet<Record<string, unknown>>(
    "SELECT * FROM masters WHERE login_email = ?",
    normalized
  );
  if (!row) return null;

  return {
    ...rowToMaster(row),
    token: String(row.token || ""),
    login_email: String(row.login_email || ""),
    password_hash: String(row.password_hash || ""),
  };
}

export function loginEmailTaken(email: string, exceptMasterId?: string): boolean {
  const normalized = normalizeLoginEmail(email);
  if (!normalized) return false;

  const row = sqlGet<{ id: string }>(
    "SELECT id FROM masters WHERE login_email = ?",
    normalized
  );
  if (!row) return false;
  if (exceptMasterId && row.id === exceptMasterId) return false;
  return true;
}

export function createPasswordResetToken(masterId: string): string {
  const db = getDb();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + RESET_TTL_MS).toISOString();
  const token = randomBytes(32).toString("hex");

  db.prepare(
    "UPDATE password_reset_tokens SET used = 1 WHERE master_id = ? AND used = 0"
  ).run(masterId);

  db.prepare(
    `INSERT INTO password_reset_tokens (token, master_id, expires_at, used, created_at)
     VALUES (?, ?, ?, 0, ?)`
  ).run(token, masterId, expiresAt, now);

  return token;
}

export function consumePasswordResetToken(token: string): string | null {
  const clean = token.trim();
  if (!clean) return null;

  const row = sqlGet<{
    master_id: string;
    expires_at: string;
    used: number;
  }>(
    `SELECT master_id, expires_at, used FROM password_reset_tokens WHERE token = ?`,
    clean
  );

  if (!row || row.used === 1) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;

  getDb()
    .prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?")
    .run(clean);

  return row.master_id;
}

export async function sendAccessRecoveryEmail(
  master: Master & { login_email: string },
  resetToken: string
): Promise<boolean> {
  const baseUrl = getServerAppUrl();
  const resetUrl = `${baseUrl}/app/reset-password?token=${encodeURIComponent(resetToken)}`;
  const loginUrl = `${baseUrl}/app/login`;

  const text = [
    `Здравствуйте, ${master.name}!`,
    "",
    "Вы запросили восстановление доступа к МояЗапись.",
    "",
    `Ваш логин (email): ${master.login_email}`,
    "",
    "Чтобы задать новый пароль, перейдите по ссылке (действует 1 час):",
    resetUrl,
    "",
    `Войти после смены пароля: ${loginUrl}`,
    "",
    "Если вы не запрашивали письмо — просто проигнорируйте его.",
  ].join("\n");

  return sendPlainEmail(
    master.login_email,
    "Восстановление доступа — МояЗапись",
    text
  );
}

export function setMasterPassword(masterId: string, passwordHash: string) {
  getDb()
    .prepare("UPDATE masters SET password_hash = ? WHERE id = ?")
    .run(passwordHash, masterId);
}

export function getMasterPasswordHash(masterId: string): string {
  const row = sqlGet<{ password_hash: string }>(
    "SELECT password_hash FROM masters WHERE id = ?",
    masterId
  );
  return String(row?.password_hash || "");
}
