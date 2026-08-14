import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LEN = 64;

export const PASSWORD_MIN_LEN = 8;

export function normalizePassword(raw: unknown): string {
  return String(raw ?? "");
}

export function validatePassword(password: string): string | null {
  const p = password.trim();
  if (p.length < PASSWORD_MIN_LEN) {
    return `Пароль: минимум ${PASSWORD_MIN_LEN} символов`;
  }
  if (!/[a-zA-Zа-яА-ЯёЁ]/.test(p) || !/\d/.test(p)) {
    return "Пароль: нужна хотя бы одна буква и одна цифра";
  }
  return null;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LEN).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, KEY_LEN).toString("hex");
    return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(derived, "hex"));
  } catch {
    return false;
  }
}
