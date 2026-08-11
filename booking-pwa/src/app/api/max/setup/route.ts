import { NextResponse } from "next/server";
import { maxSubscribeWebhook, maxSetCommands } from "@/lib/max/api";

export async function POST(request: Request) {
  const adminKey = process.env.ADMIN_SETUP_KEY;
  const provided = request.headers.get("x-admin-key");

  if (!adminKey || provided !== adminKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const webhookUrl = process.env.MAX_WEBHOOK_URL;
  const secret = process.env.MAX_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    return NextResponse.json(
      { error: "Set MAX_WEBHOOK_URL and MAX_WEBHOOK_SECRET" },
      { status: 400 }
    );
  }

  const [webhookOk, commandsOk] = await Promise.all([
    maxSubscribeWebhook(webhookUrl, secret),
    maxSetCommands(),
  ]);

  return NextResponse.json({
    webhook: webhookOk,
    commands: commandsOk,
  });
}
