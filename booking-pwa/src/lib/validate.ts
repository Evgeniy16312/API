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
