import { maxSendMessage } from "@/lib/max/api";

export interface NotificationPayload {
  masterName: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  pageUrl: string;
}

function formatMessage(p: NotificationPayload): string {
  return [
    "📅 Новая запись!",
    "",
    `👤 ${p.clientName}`,
    `📞 ${p.clientPhone}`,
    `✂️ ${p.serviceName}`,
    `🕐 ${p.date} в ${p.time}`,
    "",
    `Страница: ${p.pageUrl}`,
  ].join("\n");
}

export async function sendMaxNotification(
  userId: string,
  payload: NotificationPayload
): Promise<boolean> {
  if (!userId) return false;
  return maxSendMessage(Number(userId), formatMessage(payload), undefined, null);
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
