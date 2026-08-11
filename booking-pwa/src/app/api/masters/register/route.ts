import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/db";
import { isValidSlug, isValidPhone } from "@/lib/slots";
import { DEFAULT_SCHEDULE } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, slug, specialty } = body;

    if (!name?.trim() || !phone?.trim() || !slug?.trim()) {
      return NextResponse.json(
        { error: "Заполните имя, телефон и адрес страницы" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase();

    if (!isValidSlug(cleanSlug)) {
      return NextResponse.json(
        { error: "Адрес страницы: только латиница, цифры, дефис (от 3 символов)" },
        { status: 400 }
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "Укажите корректный номер телефона" },
        { status: 400 }
      );
    }

    const existing = getDb()
      .prepare("SELECT id FROM masters WHERE slug = ?")
      .get(cleanSlug);

    if (existing) {
      return NextResponse.json(
        { error: "Этот адрес уже занят, выберите другой" },
        { status: 409 }
      );
    }

    const id = uuidv4();
    const token = uuidv4();
    const now = new Date().toISOString();

    getDb()
      .prepare(
        `INSERT INTO masters (id, slug, name, phone, specialty, work_schedule, token, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
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

  return NextResponse.json({
      id,
      slug: cleanSlug,
      token,
      name: name.trim(),
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Ошибка регистрации" }, { status: 500 });
  }
}
