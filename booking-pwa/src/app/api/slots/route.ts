import { NextResponse } from "next/server";
import { getMasterBySlug } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getAvailableSlots } from "@/lib/slots";
import type { Booking, Service } from "@/lib/types";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const serviceId = url.searchParams.get("service_id");
  const date = url.searchParams.get("date");

  if (!slug || !serviceId || !date) {
    return NextResponse.json(
      { error: "Укажите slug, service_id и date" },
      { status: 400 }
    );
  }

  const master = getMasterBySlug(slug);
  if (!master) {
    return NextResponse.json({ error: "Мастер не найден" }, { status: 404 });
  }

  const service = getDb()
    .prepare("SELECT * FROM services WHERE id = ? AND master_id = ?")
    .get(serviceId, master.id) as Service | undefined;

  if (!service) {
    return NextResponse.json({ error: "Услуга не найдена" }, { status: 404 });
  }

  const bookings = getDb()
    .prepare(
      "SELECT * FROM bookings WHERE master_id = ? AND date = ? AND status != 'cancelled'"
    )
    .all(master.id, date) as unknown as Booking[];

  const slots = getAvailableSlots(
    date,
    master.work_schedule,
    service,
    bookings,
    master.slot_duration
  );

  return NextResponse.json({ slots });
}
