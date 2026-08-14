import { requireAuth } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import {
  createTelegramConnectCode,
  getTelegramConnectStatus,
} from "@/lib/telegram/bot";

export async function POST(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return jsonError("Не авторизован", 401);
  }

  const code = createTelegramConnectCode(master.id);
  const botUsername = process.env.TELEGRAM_BOT_USERNAME || "moyazapis_bot";

  return jsonOk({
    code,
    bot_username: botUsername,
    bot_url: `https://t.me/${botUsername}`,
    connect_command: `/connect ${code}`,
    expires_in_minutes: 15,
  });
}

export async function GET(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return jsonError("Не авторизован", 401);
  }

  return jsonOk(getTelegramConnectStatus(master.id));
}
