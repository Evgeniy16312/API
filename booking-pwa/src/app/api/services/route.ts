import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseServiceDuration, parseServicePrice } from "@/lib/validate";

export async function GET(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const services = getDb()
    .prepare("SELECT * FROM services WHERE master_id = ? ORDER BY sort_order, name")
    .all(master.id);

  return NextResponse.json(services);
}

export async function POST(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  try {
    const { name, duration, price } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Укажите название услуги" }, { status: 400 });
    }

    const durationParsed = parseServiceDuration(duration);
    if (!durationParsed.ok) {
      return NextResponse.json({ error: durationParsed.error }, { status: 400 });
    }
    const priceParsed = parseServicePrice(price);
    if (!priceParsed.ok) {
      return NextResponse.json({ error: priceParsed.error }, { status: 400 });
    }

    const id = uuidv4();
    const count = getDb()
      .prepare("SELECT COUNT(*) as c FROM services WHERE master_id = ?")
      .get(master.id) as { c: number };

    getDb()
      .prepare(
        "INSERT INTO services (id, master_id, name, duration, price, sort_order) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        id,
        master.id,
        name.trim(),
        durationParsed.value,
        priceParsed.value,
        count.c
      );

    const service = getDb().prepare("SELECT * FROM services WHERE id = ?").get(id);
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json({ error: "Ошибка создания услуги" }, { status: 500 });
  }
}
