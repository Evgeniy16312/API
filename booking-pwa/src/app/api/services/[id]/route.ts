import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { parseServiceDuration, parseServicePrice } from "@/lib/validate";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const service = getDb()
    .prepare("SELECT * FROM services WHERE id = ? AND master_id = ?")
    .get(id, master.id);

  if (!service) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  getDb().prepare("DELETE FROM services WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const service = getDb()
    .prepare("SELECT * FROM services WHERE id = ? AND master_id = ?")
    .get(id, master.id);

  if (!service) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  const fields: string[] = [];
  const values: import("@/lib/db").SqlParam[] = [];

  if (body.name !== undefined) {
    if (!String(body.name).trim()) {
      return NextResponse.json({ error: "Укажите название услуги" }, { status: 400 });
    }
    fields.push("name = ?");
    values.push(String(body.name).trim());
  }

  if (body.duration !== undefined) {
    const parsed = parseServiceDuration(body.duration);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    fields.push("duration = ?");
    values.push(parsed.value);
  }

  if (body.price !== undefined) {
    const parsed = parseServicePrice(body.price);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    fields.push("price = ?");
    values.push(parsed.value);
  }

  if (fields.length > 0) {
    values.push(id);
    getDb()
      .prepare(`UPDATE services SET ${fields.join(", ")} WHERE id = ?`)
      .run(...(values as (string | number)[]));
  }

  const updated = getDb().prepare("SELECT * FROM services WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
