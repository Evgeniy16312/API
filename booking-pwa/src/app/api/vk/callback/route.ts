import { NextResponse } from "next/server";
import { linkVkUser } from "@/lib/vk/connect";

/**
 * VK Callback API entry (confirmation + message_new with /connect CODE).
 * Set VK_CALLBACK_CONFIRMATION and VK_GROUP_TOKEN in env.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.type === "confirmation") {
      return new NextResponse(process.env.VK_CALLBACK_CONFIRMATION || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    if (body.type === "message_new") {
      const msg = body.object?.message || body.object;
      const text = String(msg?.text || "").trim();
      const fromId = String(msg?.from_id || msg?.peer_id || "");
      const match = text.match(/^\/connect\s+([a-z0-9]{4,8})$/i);
      if (match && fromId) {
        const result = linkVkUser(match[1], fromId);
        await sendVkReply(
          fromId,
          result.ok
            ? `✅ Готово, ${result.masterName}! Уведомления о записях будут приходить сюда.`
            : `❌ ${result.error}`
        );
      }
    }

    return new NextResponse("ok", { status: 200 });
  } catch (error) {
    console.error("VK callback error:", error);
    return new NextResponse("ok", { status: 200 });
  }
}

async function sendVkReply(peerId: string, message: string) {
  const token = process.env.VK_GROUP_TOKEN;
  if (!token) return;
  const params = new URLSearchParams({
    access_token: token,
    v: "5.199",
    peer_id: peerId,
    random_id: String(Date.now()),
    message,
  });
  await fetch(`https://api.vk.com/method/messages.send?${params}`, {
    method: "POST",
  });
}
