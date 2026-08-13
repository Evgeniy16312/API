import { jsonError, jsonOk } from "@/lib/http";
import { telegramSetWebhook } from "@/lib/telegram/api";

export async function POST(request: Request) {
  const adminKey = process.env.ADMIN_SETUP_KEY;
  const provided = request.headers.get("x-admin-key");

  if (!adminKey || provided !== adminKey) {
    return jsonError("Forbidden", 403);
  }

  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return jsonError(
      "Задайте TELEGRAM_WEBHOOK_URL и TELEGRAM_WEBHOOK_SECRET",
      400
    );
  }

  if (secret.length < 8 || secret.length > 256) {
    return jsonError(
      "TELEGRAM_WEBHOOK_SECRET: от 8 до 256 символов (A-Z, a-z, 0-9, _-)",
      400
    );
  }

  const webhook = await telegramSetWebhook(webhookUrl, secret);
  return jsonOk({ webhook });
}
