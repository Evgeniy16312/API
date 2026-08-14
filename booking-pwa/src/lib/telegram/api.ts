/** Override when host cannot reach api.telegram.org (common on RU VPS). */
function telegramApiRoot(): string {
  return (
    process.env.TELEGRAM_API_BASE?.replace(/\/$/, "") ||
    "https://api.telegram.org"
  );
}

export function getTelegramToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN;
}

function botUrl(method: string): string {
  const token = getTelegramToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not configured");
  return `${telegramApiRoot()}/bot${token}/${method}`;
}

export type TelegramInlineButton =
  | { text: string; callback_data: string }
  | { text: string; url: string };

export async function telegramSendMessage(
  chatId: string | number,
  text: string,
  buttons?: TelegramInlineButton[][]
): Promise<boolean> {
  if (!getTelegramToken() || !chatId) return false;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  };
  if (buttons && buttons.length > 0) {
    body.reply_markup = { inline_keyboard: buttons };
  }

  try {
    const response = await fetch(botUrl("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      console.error("Telegram send error:", response.status, await response.text());
    }
    const data = (await response.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch (error) {
    console.error("Telegram send error:", error);
    return false;
  }
}

export async function telegramSetWebhook(
  url: string,
  secret: string
): Promise<boolean> {
  if (!getTelegramToken()) return false;
  try {
    const response = await fetch(botUrl("setWebhook"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        secret_token: secret,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
    });
    const data = (await response.json()) as { ok?: boolean; description?: string };
    if (!data.ok) {
      console.error("Telegram setWebhook failed:", data.description);
    }
    return Boolean(data.ok);
  } catch (error) {
    console.error("Telegram setWebhook error:", error);
    return false;
  }
}

export async function telegramAnswerCallback(callbackQueryId: string, text: string) {
  if (!getTelegramToken()) return;
  try {
    await fetch(botUrl("answerCallbackQuery"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch (error) {
    console.error("Telegram answerCallbackQuery error:", error);
  }
}
