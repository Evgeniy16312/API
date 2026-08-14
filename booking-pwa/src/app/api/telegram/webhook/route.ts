import { NextResponse } from "next/server";
import { jsonError, jsonOk } from "@/lib/http";
import {
  handleTelegramUpdate,
  type TelegramUpdate,
} from "@/lib/telegram/bot";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const isDev = process.env.NODE_ENV === "development";

  if (!secret && !isDev) {
    console.error("TELEGRAM_WEBHOOK_SECRET is required in production");
    return jsonError("Webhook misconfigured", 500);
  }

  if (secret && !isDev) {
    const headerSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (headerSecret !== secret) {
      return jsonError("Forbidden", 403);
    }
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    await handleTelegramUpdate(update);
    return jsonOk({ ok: true });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return jsonOk({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Telegram webhook active" });
}
