import { v4 as uuidv4 } from "uuid";
import { requireAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";
import { persistImageDataUrl } from "@/lib/uploads";
import { portfolioLimitForPlan, syncMasterSubscription } from "@/lib/subscription";

export async function GET(request: Request) {
  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);

  const items = getDb()
    .prepare("SELECT * FROM portfolio WHERE master_id = ? ORDER BY sort_order")
    .all(master.id);

  return jsonOk(items);
}

export async function POST(request: Request) {
  const master = requireAuth(request);
  if (!master) return jsonError("Не авторизован", 401);

  try {
    const { image_url, caption } = await request.json();

    if (!image_url) {
      return jsonError("Загрузите фото", 400);
    }

    const storedUrl = persistImageDataUrl(master.id, image_url, "portfolio");
    const id = uuidv4();
    const count = getDb()
      .prepare("SELECT COUNT(*) as c FROM portfolio WHERE master_id = ?")
      .get(master.id) as { c: number };
    const sub = syncMasterSubscription(master.id);
    const limit = portfolioLimitForPlan(sub?.plan);
    if (count.c >= limit) {
      return jsonError(
        `На вашем тарифе можно загрузить до ${limit} фото. Перейдите на «Стандарт» или «Премиум».`,
        403
      );
    }

    getDb()
      .prepare(
        "INSERT INTO portfolio (id, master_id, image_url, caption, sort_order) VALUES (?, ?, ?, ?, ?)"
      )
      .run(id, master.id, storedUrl, caption || "", count.c);

    const item = getDb().prepare("SELECT * FROM portfolio WHERE id = ?").get(id);
    return jsonOk(item, 201);
  } catch (error) {
    console.error("Portfolio upload error:", error);
    const message =
      error instanceof Error ? error.message : "Ошибка загрузки";
    return jsonError(message, 500);
  }
}
