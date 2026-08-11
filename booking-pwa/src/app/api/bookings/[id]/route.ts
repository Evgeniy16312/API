import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return NextResponse.json({ error: "Неверный статус" }, { status: 400 });
  }

  const booking = getDb()
    .prepare("SELECT * FROM bookings WHERE id = ? AND master_id = ?")
    .get(id, master.id);

  if (!booking) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  getDb().prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);

  const updated = getDb().prepare("SELECT * FROM bookings WHERE id = ?").get(id);
  return NextResponse.json(updated);
}
