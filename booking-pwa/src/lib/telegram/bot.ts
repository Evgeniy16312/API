import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import {
  telegramAnswerCallback,
  telegramSendMessage,
} from "@/lib/telegram/api";

const CODE_TTL_MS = 15 * 60 * 1000;

export function createTelegramConnectCode(masterId: string): string {
  const code = randomBytes(3).toString("hex").toUpperCase();
  const now = new Date();
  const expires = new Date(now.getTime() + CODE_TTL_MS);

  getDb()
    .prepare(
      `INSERT INTO telegram_connect_codes (code, master_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(code, masterId, expires.toISOString(), now.toISOString());

  return code;
}

export function linkTelegramUser(
  code: string,
  telegramUserId: number
): { ok: boolean; masterName?: string; error?: string } {
  const row = getDb()
    .prepare(
      "SELECT * FROM telegram_connect_codes WHERE code = ? AND used = 0"
    )
    .get(code.toUpperCase()) as
    | { master_id: string; expires_at: string }
    | undefined;

  if (!row) {
    return { ok: false, error: "Код не найден или уже использован" };
  }
  if (new Date(row.expires_at) < new Date()) {
    return { ok: false, error: "Код истёк. Получите новый в приложении." };
  }

  const master = getDb()
    .prepare("SELECT id, name FROM masters WHERE id = ?")
    .get(row.master_id) as { id: string; name: string } | undefined;

  if (!master) {
    return { ok: false, error: "Мастер не найден" };
  }

  getDb()
    .prepare("UPDATE masters SET telegram_user_id = ? WHERE id = ?")
    .run(String(telegramUserId), master.id);

  getDb()
    .prepare(
      "UPDATE telegram_connect_codes SET used = 1, telegram_user_id = ? WHERE code = ?"
    )
    .run(String(telegramUserId), code.toUpperCase());

  return { ok: true, masterName: master.name };
}

export function getTelegramConnectStatus(masterId: string) {
  const master = getDb()
    .prepare("SELECT telegram_user_id FROM masters WHERE id = ?")
    .get(masterId) as { telegram_user_id: string } | undefined;

  const pending = getDb()
    .prepare(
      `SELECT code, expires_at FROM telegram_connect_codes
       WHERE master_id = ? AND used = 0 AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(masterId, new Date().toISOString()) as
    | { code: string; expires_at: string }
    | undefined;

  return {
    connected: Boolean(master?.telegram_user_id),
    telegram_user_id: master?.telegram_user_id || "",
    pending_code: pending?.code || null,
    code_expires_at: pending?.expires_at || null,
  };
}

export type TelegramUpdate = {
  update_id?: number;
  message?: {
    text?: string;
    from?: { id: number; first_name?: string };
    chat?: { id: number };
  };
  callback_query?: {
    id: string;
    data?: string;
    from?: { id: number };
    message?: { chat?: { id: number } };
  };
};

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (update.callback_query) {
    const userId = update.callback_query.from?.id;
    if (!userId) return;
    await handleBookingCallback(
      userId,
      update.callback_query.data || "",
      update.callback_query.id
    );
    return;
  }

  const message = update.message;
  if (!message?.from?.id) return;

  const userId = message.from.id;
  const firstName = message.from.first_name || "друг";
  const text = (message.text || "").trim();
  const lower = text.toLowerCase();

  if (lower === "/id" || lower === "id") {
    await telegramSendMessage(
      userId,
      `Ваш Telegram ID: ${userId}\n\nДля автоподключения используйте /connect КОД из приложения МояЗапись.`
    );
    return;
  }

  if (lower === "/help" || lower === "help" || lower === "помощь") {
    await telegramSendMessage(
      userId,
      "Команды бота МояЗапись:\n\n/start — начать\n/connect КОД — подключить уведомления\n/id — узнать ID\n/help — справка"
    );
    return;
  }

  const connectMatch = text.match(
    /^\/(?:start\s+connect_|connect\s+)([a-z0-9]{4,8})$/i
  );
  if (connectMatch) {
    const result = linkTelegramUser(connectMatch[1], userId);
    if (result.ok) {
      await telegramSendMessage(
        userId,
        `Готово, ${result.masterName}!\n\nТеперь уведомления о записях будут приходить сюда в Telegram (если выбран канал Telegram в настройках).`
      );
    } else {
      await telegramSendMessage(userId, result.error || "Ошибка");
    }
    return;
  }

  if (lower === "/start" || lower.startsWith("/start")) {
    await telegramSendMessage(
      userId,
      `Привет, ${firstName}!\n\nЯ бот МояЗапись.\n\n1. Откройте приложение → Настройки → Telegram\n2. Нажмите «Подключить Telegram»\n3. Отправьте мне: /connect ВАШ_КОД`
    );
    return;
  }

  await telegramSendMessage(
    userId,
    "Не понял команду.\n\n/connect КОД — подключить\n/id — узнать ID\n/help — справка"
  );
}

async function handleBookingCallback(
  telegramUserId: number,
  payload: string,
  callbackId: string
) {
  const match = payload.match(/^(ok|no):([0-9a-f-]{36})$/i);
  if (!match) {
    await telegramAnswerCallback(callbackId, "Неизвестная кнопка");
    return;
  }

  const action = match[1].toLowerCase();
  const bookingId = match[2];
  const master = getDb()
    .prepare("SELECT id, name FROM masters WHERE telegram_user_id = ?")
    .get(String(telegramUserId)) as { id: string; name: string } | undefined;

  if (!master) {
    await telegramAnswerCallback(callbackId, "Сначала /connect КОД");
    await telegramSendMessage(
      telegramUserId,
      "Сначала подключите уведомления: /connect КОД"
    );
    return;
  }

  const status = action === "ok" ? "confirmed" : "cancelled";
  const booking = getDb()
    .prepare(
      "SELECT id, client_name, service_name, date, time, status FROM bookings WHERE id = ? AND master_id = ?"
    )
    .get(bookingId, master.id) as
    | {
        id: string;
        client_name: string;
        service_name: string;
        date: string;
        time: string;
        status: string;
      }
    | undefined;

  if (!booking) {
    await telegramAnswerCallback(callbackId, "Запись не найдена");
    return;
  }

  getDb()
    .prepare("UPDATE bookings SET status = ? WHERE id = ?")
    .run(status, bookingId);

  const label = status === "confirmed" ? "подтверждена" : "отменена";
  await telegramAnswerCallback(callbackId, `Запись ${label}`);
  await telegramSendMessage(
    telegramUserId,
    `Запись ${label}:\n${booking.client_name} · ${booking.service_name}\n${booking.date} ${booking.time}`
  );
}
