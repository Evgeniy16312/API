import { maxSendMessage, type MaxInlineButton } from "@/lib/max/api";

export interface NotificationPayload {
  masterName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  pageUrl: string;
  bookingId?: string;
  kind?: "new_booking" | "reminder_24h" | "reminder_2h" | "cancelled_by_client";
}

function titleFor(kind?: NotificationPayload["kind"]): string {
  if (kind === "reminder_24h") return "⏰ Напоминание: завтра запись";
  if (kind === "reminder_2h") return "⏰ Напоминание: запись через ~2 часа";
  if (kind === "cancelled_by_client") return "❌ Клиент отменил запись";
  return "📅 Новая запись!";
}

export function formatMessage(p: NotificationPayload): string {
  return [
    titleFor(p.kind),
    "",
    `👤 ${p.clientName}`,
    `📞 ${p.clientPhone}`,
    `✂️ ${p.serviceName}`,
    `🕐 ${p.date} в ${p.time}`,
    "",
    `Страница: ${p.pageUrl}`,
  ].join("\n");
}

function bookingButtons(
  bookingId?: string,
  kind?: NotificationPayload["kind"]
): MaxInlineButton[][] | undefined {
  if (!bookingId || kind === "cancelled_by_client") return undefined;
  return [
    [
      { type: "callback", text: "✅ Подтвердить", payload: `ok:${bookingId}` },
      { type: "callback", text: "❌ Отменить", payload: `no:${bookingId}` },
    ],
  ];
}

export async function sendMaxNotification(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  if (!userId) return false;
  return maxSendMessage(
    Number(userId),
    formatMessage(payload),
    bookingButtons(payload.bookingId, payload.kind),
    null
  );
}

export async function sendVkNotification(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  const token = process.env.VK_GROUP_TOKEN;
  if (!token || !userId) return false;

  try {
    const params = new URLSearchParams({
      access_token: token,
      v: "5.199",
      peer_id: userId,
      random_id: String(Date.now()),
      message: formatMessage(payload),
    });

    const response = await fetch(
      `https://api.vk.com/method/messages.send?${params}`,
      { method: "POST" }
    );

    const data = await response.json();
    return !data.error;
  } catch (error) {
    console.error("VK notification error:", error);
    return false;
  }
}

/** @deprecated prefer enqueue + flushOutbox — kept for direct sends */
export async function notifyMaster(
  maxUserId: string,
  vkUserId: string,
  payload: NotificationPayload
): Promise<{ max: boolean; vk: boolean }> {
  const [maxResult, vkResult] = await Promise.all([
    sendMaxNotification(maxUserId, payload),
    sendVkNotification(vkUserId, payload),
  ]);

  return { max: maxResult, vk: vkResult };
}
