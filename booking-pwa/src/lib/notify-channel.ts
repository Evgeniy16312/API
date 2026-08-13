import type { Master } from "@/lib/types";

export const NOTIFY_CHANNELS = ["max", "vk", "telegram", "email"] as const;
export type NotifyChannel = (typeof NOTIFY_CHANNELS)[number];

/**
 * Temporary UI gate: messengers hidden until MAX/Telegram rollout is ready.
 * Backend + connect flows stay in codebase — only master-facing UI is filtered.
 */
export const NOTIFY_UI_ENABLED: readonly NotifyChannel[] = ["email"];

export function isNotifyChannel(value: unknown): value is NotifyChannel {
  return (
    typeof value === "string" &&
    (NOTIFY_CHANNELS as readonly string[]).includes(value)
  );
}

export function normalizeNotifyChannel(
  value: unknown,
  fallback: NotifyChannel = "email"
): NotifyChannel {
  return isNotifyChannel(value) ? value : fallback;
}

/** Recipient for the master's preferred channel, or null if not connected. */
export function resolveNotifyTarget(master: Master): {
  channel: NotifyChannel;
  recipient: string;
} | null {
  const channel = normalizeNotifyChannel(master.notify_channel);
  if (channel === "max" && master.max_user_id) {
    return { channel, recipient: master.max_user_id };
  }
  if (channel === "vk" && master.vk_user_id) {
    return { channel, recipient: master.vk_user_id };
  }
  if (channel === "telegram" && master.telegram_user_id) {
    return { channel, recipient: master.telegram_user_id };
  }
  if (channel === "email" && master.notify_email) {
    return { channel, recipient: master.notify_email };
  }
  return null;
}

export function notifyChannelMissingReason(channel: NotifyChannel): string {
  if (channel === "max") {
    return "Сначала подключите MAX-бота";
  }
  if (channel === "vk") {
    return "Сначала укажите или подключите VK";
  }
  if (channel === "telegram") {
    return "Сначала подключите Telegram-бота";
  }
  return "Укажите email для уведомлений";
}
