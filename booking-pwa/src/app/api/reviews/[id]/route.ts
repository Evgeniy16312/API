import { setReviewStatus } from "@/lib/reviews";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);

  const { id } = await params;
  const body = await request.json();
  if (!["published", "hidden"].includes(body.status)) {
    return jsonError("Неверный статус", 400);
  }

  const updated = setReviewStatus(id, master.id, body.status);
  if (!updated) return jsonError("Отзыв не найден", 404);
  return jsonOk(updated);
}
