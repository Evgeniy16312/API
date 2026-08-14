import { deleteAllMastersAsAdmin, listMastersForAdmin } from "@/lib/admin";
import { jsonError, jsonOk, requireAdmin } from "@/lib/http";

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return jsonError("Forbidden", 403);
  }
  const url = new URL(request.url);
  const masters = listMastersForAdmin({
    q: url.searchParams.get("q") || undefined,
    status: url.searchParams.get("status") || undefined,
    plan: url.searchParams.get("plan") || undefined,
    blocked: (url.searchParams.get("blocked") as "all" | "yes" | "no") || "all",
    sort:
      (url.searchParams.get("sort") as
        | "created_at"
        | "name"
        | "bookings"
        | "paid_until"
        | "status") || "created_at",
    order: (url.searchParams.get("order") as "asc" | "desc") || "desc",
  });
  return jsonOk({ masters, total: masters.length });
}

/** Clear all masters — body: { confirm: "DELETE_ALL" } */
export async function DELETE(request: Request) {
  if (!requireAdmin(request)) {
    return jsonError("Forbidden", 403);
  }
  try {
    const body = await request.json().catch(() => ({}));
    const result = deleteAllMastersAsAdmin(String(body.confirm || ""));
    if (!result.ok) {
      return jsonError(result.error, result.status);
    }
    return jsonOk({ deleted: result.deleted });
  } catch (error) {
    console.error("Admin delete all masters error:", error);
    return jsonError("Ошибка удаления", 500);
  }
}
