import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/password";
import { loginEmailTaken } from "@/lib/master-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { isValidSlug } from "@/lib/slots";
import { isValidEmail, normalizeLoginEmail, normalizeRuPhone } from "@/lib/validate";
import { attachSessionCookie } from "@/lib/session";
import { DEFAULT_SCHEDULE } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, slug, specialty, email, password } = body;

    if (!name?.trim() || !phone?.trim() || !slug?.trim()) {
      return jsonError("Заполните имя, телефон и адрес страницы", 400);
    }

    const loginEmail = normalizeLoginEmail(email);
    if (!loginEmail || !isValidEmail(loginEmail)) {
      return jsonError("Укажите корректный email — он будет вашим логином", 400);
    }

    const passwordError = validatePassword(String(password || ""));
    if (passwordError) {
      return jsonError(passwordError, 400);
    }

    if (loginEmailTaken(loginEmail)) {
      return jsonError("Этот email уже зарегистрирован", 409);
    }

    const cleanSlug = slug.trim().toLowerCase();

    if (!isValidSlug(cleanSlug)) {
      return jsonError(
        "Адрес страницы: только латиница, цифры, дефис (от 3 символов)",
        400
      );
    }

    const phoneNorm = normalizeRuPhone(phone);
    if (!phoneNorm) {
      return jsonError("Телефон: +7 и 10 цифр", 400);
    }

    const existing = getDb()
      .prepare("SELECT id FROM masters WHERE slug = ?")
      .get(cleanSlug);

    if (existing) {
      return jsonError("Этот адрес уже занят, выберите другой", 409);
    }

    const id = uuidv4();
    const token = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = hashPassword(String(password));

    getDb()
      .prepare(
        `INSERT INTO masters (
          id, slug, name, phone, specialty, work_schedule, token,
          login_email, password_hash, notify_email, created_at, notify_channel
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'email')`
      )
      .run(
        id,
        cleanSlug,
        name.trim(),
        phoneNorm,
        specialty?.trim() || "",
        JSON.stringify(DEFAULT_SCHEDULE),
        token,
        loginEmail,
        passwordHash,
        loginEmail,
        now
      );

    const response = jsonOk({
      id,
      slug: cleanSlug,
      token,
      name: name.trim(),
      login_email: loginEmail,
    });
    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Register error:", error);
    return jsonError("Ошибка регистрации", 500);
  }
}
