import { updateBookingStatus } from "@/lib/bookings";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);

  const { id } = await params;
  const { status } = await request.json();

  if (!["pending", "confirmed", "cancelled"].includes(status)) {
    return jsonError("Неверный статус", 400);
  }

  const updated = updateBookingStatus(id, master.id, status);
  if (!updated) return jsonError("Запись не найдена", 404);
  return jsonOk(updated);
}
