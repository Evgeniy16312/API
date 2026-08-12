import { NextResponse } from "next/server";
import { handleMaxUpdate } from "@/lib/max/bot";
import type { MaxUpdate } from "@/lib/max/bot";
import { jsonError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  const secret = process.env.MAX_WEBHOOK_SECRET;
  const isDev = process.env.NODE_ENV === "development";

  if (!secret && !isDev) {
    console.error("MAX_WEBHOOK_SECRET is required in production");
    return jsonError("Webhook misconfigured", 500);
  }

  if (secret) {
    const headerSecret = request.headers.get("X-Max-Bot-Api-Secret");
    if (headerSecret !== secret) {
      return jsonError("Forbidden", 403);
    }
  }

  try {
    const update = (await request.json()) as MaxUpdate;
    await handleMaxUpdate(update);
    return jsonOk({ ok: true });
  } catch (error) {
    console.error("MAX webhook error:", error);
    // Always 200 to provider after auth — avoid infinite retries on handler bugs
    return jsonOk({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "MAX webhook active" });
}
