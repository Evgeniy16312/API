import { getDb } from "@/lib/db";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";
import { getDaySlotOverview } from "@/lib/slots";
import type { Booking, Service } from "@/lib/types";

/** Master calendar: free / busy / past slots for a day (includes bookings). */
export async function GET(request: Request) {
  const master = requireMaster(request);
  if (!master) {
    return jsonError("Не авторизован", 401);
  }

  const url = new URL(request.url);
  const date = url.searchParams.get("date");
  const serviceId = url.searchParams.get("service_id");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonError("Укажите date (yyyy-MM-dd)", 400);
  }

  let service: Service | undefined;
  if (serviceId) {
    service = getDb()
      .prepare("SELECT * FROM services WHERE id = ? AND master_id = ?")
      .get(serviceId, master.id) as Service | undefined;
    if (!service) {
      return jsonError("Услуга не найдена", 404);
    }
  } else {
    service = getDb()
      .prepare(
        "SELECT * FROM services WHERE master_id = ? ORDER BY sort_order, name LIMIT 1"
      )
      .get(master.id) as Service | undefined;
  }

  const stepDuration = service?.duration || master.slot_duration || 60;

  const bookings = getDb()
    .prepare(
      `SELECT b.*, COALESCE(b.service_duration, s.duration, ?) AS service_duration
       FROM bookings b
       LEFT JOIN services s ON s.id = b.service_id
       WHERE b.master_id = ? AND b.date = ? AND b.status != 'cancelled'`
    )
    .all(master.slot_duration, master.id, date) as unknown as Booking[];

  const overview = getDaySlotOverview(
    date,
    master.work_schedule,
    stepDuration,
    bookings,
    master.slot_duration
  );

  return jsonOk({
    date,
    service_id: service?.id ?? null,
    step_minutes: stepDuration,
    overview,
    free: overview.filter((s) => s.status === "free").map((s) => s.time),
  });
}
