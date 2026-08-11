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
  const item = getDb()
    .prepare("SELECT * FROM portfolio WHERE id = ? AND master_id = ?")
    .get(id, master.id);

  if (!item) {
    return NextResponse.json({ error: "Фото не найдено" }, { status: 404 });
  }

  getDb().prepare("DELETE FROM portfolio WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
