import {
  cancelBookingByManageToken,
  getBookingByManageToken,
} from "@/lib/bookings";
import { jsonError, jsonOk } from "@/lib/http";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const booking = getBookingByManageToken(token);
  if (!booking) return jsonError("Запись не найдена", 404);
  return jsonOk(booking);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const url = new URL(request.url);
  // support /cancel via query or body action
  const body = await request.json().catch(() => ({}));
  const action = body.action || url.searchParams.get("action") || "cancel";

  if (action !== "cancel") {
    return jsonError("Неизвестное действие", 400);
  }

  const result = cancelBookingByManageToken(token);
  if (!result.ok) return jsonError(result.error, result.status);
  return jsonOk(result.booking);
}
