import { listMastersForAdmin } from "@/lib/admin";
import { jsonError, jsonOk, requireAdmin } from "@/lib/http";

export async function GET(request: Request) {
  if (!requireAdmin(request)) {
    return jsonError("Forbidden", 403);
  }
  return jsonOk({ masters: listMastersForAdmin() });
}
