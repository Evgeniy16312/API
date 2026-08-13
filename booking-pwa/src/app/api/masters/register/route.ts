import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { isValidSlug, isValidPhone } from "@/lib/slots";
import { attachSessionCookie } from "@/lib/session";
import { DEFAULT_SCHEDULE } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, slug, specialty } = body;

    if (!name?.trim() || !phone?.trim() || !slug?.trim()) {
      return jsonError("Заполните имя, телефон и адрес страницы", 400);
    }

    const cleanSlug = slug.trim().toLowerCase();

    if (!isValidSlug(cleanSlug)) {
      return jsonError(
        "Адрес страницы: только латиница, цифры, дефис (от 3 символов)",
        400
      );
    }

    if (!isValidPhone(phone)) {
      return jsonError("Укажите корректный номер телефона", 400);
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

    getDb()
      .prepare(
        `INSERT INTO masters (id, slug, name, phone, specialty, work_schedule, token, created_at, notify_channel)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'email')`
      )
      .run(
        id,
        cleanSlug,
        name.trim(),
        phone.trim(),
        specialty?.trim() || "",
        JSON.stringify(DEFAULT_SCHEDULE),
        token,
        now
      );

    const response = jsonOk({
      id,
      slug: cleanSlug,
      token,
      name: name.trim(),
    });
    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Register error:", error);
    return jsonError("Ошибка регистрации", 500);
  }
}
