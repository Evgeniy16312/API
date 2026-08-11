import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const items = getDb()
    .prepare("SELECT * FROM portfolio WHERE master_id = ? ORDER BY sort_order")
    .all(master.id);

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { image_url, caption } = await request.json();

    if (!image_url) {
      return NextResponse.json({ error: "Загрузите фото" }, { status: 400 });
    }

    const id = uuidv4();
    const count = getDb()
      .prepare("SELECT COUNT(*) as c FROM portfolio WHERE master_id = ?")
      .get(master.id) as { c: number };

    getDb()
      .prepare(
        "INSERT INTO portfolio (id, master_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?, ?)"
      )
      .run(id, master.id, image_url, caption || "", count.c);

    const item = getDb().prepare("SELECT * FROM portfolio WHERE id = ?").get(id);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Portfolio upload error:", error);
    return NextResponse.json({ error: "Ошибка загрузки" }, { status: 500 });
  }
}
