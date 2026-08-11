import { NextResponse } from "next/server";
import { handleMaxUpdate } from "@/lib/max/bot";
import type { MaxUpdate } from "@/lib/max/bot";

export async function POST(request: Request) {
  const secret = process.env.MAX_WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = request.headers.get("X-Max-Bot-Api-Secret");
    if (headerSecret !== secret) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const update = (await request.json()) as MaxUpdate;
    await handleMaxUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("MAX webhook error:", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  return NextResponse.json({ status: "MAX webhook active" });
}
