import { getDb } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";
import { maxSendMessage } from "./api";

const CODE_TTL_MS = 15 * 60 * 1000;

export function initMaxTables() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS max_connect_codes (
      code TEXT PRIMARY KEY,
      master_id TEXT NOT NULL,
      max_user_id TEXT DEFAULT '',
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_max_codes_master ON max_connect_codes(master_id);
  `);
}

export function createConnectCode(masterId: string): string {
  initMaxTables();
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  const now = new Date();
  const expires = new Date(now.getTime() + CODE_TTL_MS);

  getDb()
    .prepare(
      `INSERT INTO max_connect_codes (code, master_id, expires_at, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .run(code, masterId, expires.toISOString(), now.toISOString());

  return code;
}

export function linkMaxUser(
  code: string,
  maxUserId: number
): { ok: boolean; masterName?: string; error?: string } {
  initMaxTables();
  const row = getDb()
    .prepare("SELECT * FROM max_connect_codes WHERE code = ? AND used = 0")
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
    .prepare("UPDATE masters SET max_user_id = ? WHERE id = ?")
    .run(String(maxUserId), master.id);

  getDb()
    .prepare(
      "UPDATE max_connect_codes SET used = 1, max_user_id = ? WHERE code = ?"
    )
    .run(String(maxUserId), code.toUpperCase());

  return { ok: true, masterName: master.name };
}

export function getConnectStatus(masterId: string) {
  initMaxTables();
  const master = getDb()
    .prepare("SELECT max_user_id FROM masters WHERE id = ?")
    .get(masterId) as { max_user_id: string } | undefined;

  const pending = getDb()
    .prepare(
      `SELECT code, expires_at FROM max_connect_codes
       WHERE master_id = ? AND used = 0 AND expires_at > ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(masterId, new Date().toISOString()) as
    | { code: string; expires_at: string }
    | undefined;

  return {
    connected: Boolean(master?.max_user_id),
    max_user_id: master?.max_user_id || "",
    pending_code: pending?.code || null,
    code_expires_at: pending?.expires_at || null,
  };
}

export interface MaxUpdate {
  update_type: string;
  timestamp?: number;
  user?: { user_id: number; first_name?: string; name?: string };
  message?: {
    sender?: { user_id: number; first_name?: string; name?: string };
    body?: { text?: string };
  };
  callback?: { user?: { user_id: number }; payload?: string };
}

function extractUserId(update: MaxUpdate): number | null {
  if (update.user?.user_id) return update.user.user_id;
  if (update.message?.sender?.user_id) return update.message.sender.user_id;
  if (update.callback?.user?.user_id) return update.callback.user.user_id;
  return null;
}

function extractText(update: MaxUpdate): string {
  return update.message?.body?.text?.trim() || "";
}

export async function handleMaxUpdate(update: MaxUpdate): Promise<void> {
  const userId = extractUserId(update);
  if (!userId) return;

  const firstName =
    update.user?.first_name ||
    update.message?.sender?.first_name ||
    update.user?.name ||
    "друг";

  if (update.update_type === "bot_started") {
    await maxSendMessage(
      userId,
      `Привет, ${firstName}! 👋\n\nЯ бот **МояЗапись** — присылаю уведомления о новых записях клиентов.\n\nЧтобы подключить:\n1. Откройте приложение → Настройки → MAX\n2. Нажмите «Подключить MAX»\n3. Отправьте мне код командой:\n/connect КОД\n\nИли узнайте свой ID: /id`,
      [
        [
          {
            type: "link",
            text: "📱 Открыть приложение",
            url: process.env.NEXT_PUBLIC_APP_URL || "https://example.com/app",
          },
        ],
      ]
    );
    return;
  }

  if (update.update_type === "message_created") {
    const text = extractText(update).toLowerCase();

    if (text === "/id" || text === "id") {
      await maxSendMessage(
        userId,
        `Ваш ID в MAX: \`${userId}\`\n\nСкопируйте и вставьте в настройках приложения, или используйте /connect для автоподключения.`
      );
      return;
    }

    if (text === "/help" || text === "help" || text === "помощь") {
      await maxSendMessage(
        userId,
        `**Команды бота:**\n\n/start — начать\n/connect КОД — подключить уведомления\n/id — узнать свой ID\n/help — эта справка\n\nКод получите в приложении МояЗапись → Настройки → Подключить MAX`
      );
      return;
    }

    const connectMatch = text.match(
      /^\/(?:start\s+connect_|connect\s+)([a-z0-9]{4,8})$/i
    );
    if (connectMatch) {
      const result = linkMaxUser(connectMatch[1], userId);
      if (result.ok) {
        await maxSendMessage(
          userId,
          `✅ Готово, ${result.masterName}!\n\nТеперь вы будете получать уведомления о новых записях прямо сюда в MAX.`
        );
      } else {
        await maxSendMessage(userId, `❌ ${result.error}`);
      }
      return;
    }

    if (text === "/start" || text.startsWith("/start")) {
      await maxSendMessage(
        userId,
        `Привет, ${firstName}! 👋\n\nЧтобы получать уведомления о записях:\n\n1. Откройте приложение МояЗапись\n2. Настройки → Подключить MAX\n3. Отправьте мне: /connect ВАШ_КОД`
      );
      return;
    }

    await maxSendMessage(
      userId,
      `Не понял команду 🤔\n\nИспользуйте:\n/connect КОД — подключить уведомления\n/id — узнать ID\n/help — справка`
    );
  }
}
