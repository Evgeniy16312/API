import { createReview } from "@/lib/reviews";
import { listMasterReviews } from "@/lib/reviews";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";

export async function GET(request: Request) {
  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);
  return jsonOk(listMasterReviews(master.id));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createReview(body);
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }
    return jsonOk(result.review, 201);
  } catch (error) {
    console.error("Create review error:", error);
    return jsonError("Ошибка сохранения отзыва", 500);
  }
}
