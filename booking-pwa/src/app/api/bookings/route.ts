import { jsonError, jsonOk, requireMaster } from "@/lib/http";
import { getDb } from "@/lib/db";
import { createBooking } from "@/lib/bookings";
import type { Booking } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createBooking(body);
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }
    return jsonOk(
      { id: result.id, status: "pending", manage_token: result.manage_token },
      201
    );
  } catch (error) {
    console.error("Booking error:", error);
    return jsonError("Ошибка записи", 500);
  }
}

export async function GET(request: Request) {
  const master = requireMaster(request);
  if (!master) {
    return jsonError("Не авторизован", 401);
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = "SELECT * FROM bookings WHERE master_id = ?";
  const params: import("@/lib/db").SqlParam[] = [master.id];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }

  query += " ORDER BY date DESC, time DESC";

  const bookings = getDb().prepare(query).all(...params) as unknown as Booking[];
  return jsonOk(bookings);
}
