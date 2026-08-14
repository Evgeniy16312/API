import { getMasterBySlug } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getAvailableDates, getAvailableSlots } from "@/lib/slots";
import type { Booking, Service } from "@/lib/types";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const serviceId = url.searchParams.get("service_id");
  const date = url.searchParams.get("date");

  if (!slug) {
    return jsonError("Укажите slug", 400);
  }

  const master = getMasterBySlug(slug);
  if (!master) {
    return jsonError("Мастер не найден", 404);
  }

  // Available working dates from weekly schedule
  if (!date) {
    const dates = getAvailableDates(master.work_schedule, 28);
    return jsonOk({ dates });
  }

  if (!serviceId) {
    return jsonError("Укажите service_id и date", 400);
  }

  const service = getDb()
    .prepare("SELECT * FROM services WHERE id = ? AND master_id = ?")
    .get(serviceId, master.id) as Service | undefined;

  if (!service) {
    return jsonError("Услуга не найдена", 404);
  }

  const bookings = getDb()
    .prepare(
      `SELECT b.*, COALESCE(b.service_duration, s.duration, ?) AS service_duration
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       WHERE b.master_id = ? AND b.date = ? AND b.status != 'cancelled'`
    )
    .all(master.slot_duration, master.id, date) as unknown as Booking[];
  const slots = getAvailableSlots(
    date,
    master.work_schedule,
    service,
    bookings,
    master.slot_duration
  );

  return jsonOk({ slots, dates: getAvailableDates(master.work_schedule, 28) });
}
