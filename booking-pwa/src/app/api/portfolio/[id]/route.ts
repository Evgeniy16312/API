import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/http";
import { tryDeleteUpload } from "@/lib/uploads";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const master = requireAuth(request);
  if (!master) return jsonError("Не авторизован", 401);

  const { id } = await params;
  const item = getDb()
    .prepare("SELECT * FROM portfolio WHERE id = ? AND master_id = ?")
    .get(id, master.id) as { image_url?: string } | undefined;

  if (!item) return jsonError("Фото не найдено", 404);

  if (item.image_url) tryDeleteUpload(item.image_url);
  getDb().prepare("DELETE FROM portfolio WHERE id = ?").run(id);
  return jsonOk({ ok: true });
}
