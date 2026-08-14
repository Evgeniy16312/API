/** RU mobile: +7 and 10 digits. Email RFC-lite. Safe for client bundle. */

export const EMAIL_REGEX =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** 10 national digits after +7 */
export const PHONE_NATIONAL_REGEX = /^\d{10}$/;

export function digitsOnly(value: string): string {
  return String(value || "").replace(/\D/g, "");
}

/**
 * Accepts +7XXXXXXXXXX, 8XXXXXXXXXX, 7XXXXXXXXXX, or 10 national digits.
 * Returns canonical +7XXXXXXXXXX or null.
 */
export function normalizeRuPhone(input: string): string | null {
  let d = digitsOnly(input);
  if (d.startsWith("8") && d.length === 11) d = `7${d.slice(1)}`;
  if (d.length === 10) d = `7${d}`;
  if (d.length === 11 && d.startsWith("7") && PHONE_NATIONAL_REGEX.test(d.slice(1))) {
    return `+${d}`;
  }
  return null;
}

export function isValidPhone(phone: string): boolean {
  return normalizeRuPhone(phone) !== null;
}

/** 10 digits for the input to the right of +7 */
export function nationalPhoneDigits(input: string): string {
  const normalized = normalizeRuPhone(input);
  if (normalized) return normalized.slice(2);
  const d = digitsOnly(input);
  if (d.startsWith("7") || d.startsWith("8")) return d.slice(1, 11);
  return d.slice(0, 10);
}

export function composeRuPhone(national10: string): string {
  const d = digitsOnly(national10).slice(0, 10);
  return d ? `+7${d}` : "+7";
}

export function isValidEmail(email: string): boolean {
  const v = String(email || "").trim();
  if (!v) return false;
  if (v.length > 254) return false;
  return EMAIL_REGEX.test(v);
}

export function normalizeLoginEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

/** Услуга: длительность и цена */
export const SERVICE_DURATION_MIN = 15;
export const SERVICE_DURATION_MAX = 1440;
export const SERVICE_PRICE_MIN = 0;
export const SERVICE_PRICE_MAX = 100_000;

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function parseServiceDuration(raw: unknown): ParseResult<number> {
  const s = String(raw ?? "").trim();
  if (!s) {
    return { ok: false, error: "Укажите длительность в минутах" };
  }
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    return { ok: false, error: "Длительность: только целое число минут" };
  }
  if (n < SERVICE_DURATION_MIN) {
    return {
      ok: false,
      error: `Длительность: минимум ${SERVICE_DURATION_MIN} мин`,
    };
  }
  if (n > SERVICE_DURATION_MAX) {
    return {
      ok: false,
      error: `Длительность: максимум ${SERVICE_DURATION_MAX} мин`,
    };
  }
  return { ok: true, value: n };
}

export function parseServicePrice(raw: unknown): ParseResult<number> {
  const s = String(raw ?? "").trim();
  if (!s) {
    return { ok: true, value: 0 };
  }
  const n = parseInt(s, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) {
    return { ok: false, error: "Цена: только целое число" };
  }
  if (n < SERVICE_PRICE_MIN) {
    return { ok: false, error: "Цена не может быть отрицательной" };
  }
  if (n > SERVICE_PRICE_MAX) {
    return {
      ok: false,
      error: `Цена: максимум ${SERVICE_PRICE_MAX.toLocaleString("ru-RU")} ₽`,
    };
  }
  return { ok: true, value: n };
}

/** Цифры для поля ввода, с опциональным верхним пределом. */
export function digitsInput(
  value: string,
  maxLen: number,
  maxValue?: number
): string {
  let d = digitsOnly(value).slice(0, maxLen);
  if (maxValue !== undefined && d) {
    const n = parseInt(d, 10);
    if (Number.isFinite(n) && n > maxValue) d = String(maxValue);
  }
  return d;
}
