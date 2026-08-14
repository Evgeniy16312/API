import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createConnectCode, getConnectStatus } from "@/lib/max/bot";

export async function POST(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const code = createConnectCode(master.id);
  const botUsername = process.env.MAX_BOT_USERNAME || "moyazapis_bot";

  return NextResponse.json({
    code,
    bot_username: botUsername,
    bot_url: `https://max.ru/${botUsername}`,
    connect_command: `/connect ${code}`,
    expires_in_minutes: 15,
  });
}

export async function GET(request: Request) {
  const master = requireAuth(request);
  if (!master) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  return NextResponse.json(getConnectStatus(master.id));
}
