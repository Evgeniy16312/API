import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

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

  for (const key of ["name", "duration", "price"] as const) {
    if (body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
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
