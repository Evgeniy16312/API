const MAX_API = "https://platform-api2.max.ru";

export function getMaxToken(): string | undefined {
  return process.env.MAX_BOT_TOKEN;
}

export function maxHeaders(): HeadersInit {
  const token = getMaxToken();
  if (!token) throw new Error("MAX_BOT_TOKEN not configured");
  return {
    Authorization: token,
    "Content-Type": "application/json",
  };
}

export interface MaxInlineButton {
  type: "link" | "callback" | "message";
  text: string;
  url?: string;
  payload?: string;
}

export async function maxSendMessage(
  userId: number,
  text: string,
  buttons?: MaxInlineButton[][],
  format: "markdown" | "html" | null = "markdown"
): Promise<boolean> {
  const token = getMaxToken();
  if (!token) return false;

  const body: Record<string, unknown> = { text };
  if (format) body.format = format;

  if (buttons && buttons.length > 0) {
    body.attachments = [
      {
        type: "inline_keyboard",
        payload: { buttons },
      },
    ];
  }

  try {
    const response = await fetch(`${MAX_API}/messages?user_id=${userId}`, {
      method: "POST",
      headers: maxHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("MAX send error:", response.status, err);
    }

    return response.ok;
  } catch (error) {
    console.error("MAX send error:", error);
    return false;
  }
}

export async function maxSubscribeWebhook(
  url: string,
  secret: string
): Promise<boolean> {
  const token = getMaxToken();
  if (!token) return false;

  try {
    const response = await fetch(`${MAX_API}/subscriptions`, {
      method: "POST",
      headers: maxHeaders(),
      body: JSON.stringify({
        url,
        secret,
        update_types: ["message_created", "bot_started", "message_callback"],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("MAX webhook subscribe error:", data);
    }
    return response.ok;
  } catch (error) {
    console.error("MAX webhook subscribe error:", error);
    return false;
  }
}

export async function maxSetCommands(): Promise<boolean> {
  const token = getMaxToken();
  if (!token) return false;

  try {
    const response = await fetch(`${MAX_API}/me/commands`, {
      method: "PATCH",
      headers: maxHeaders(),
      body: JSON.stringify({
        commands: [
          { name: "start", description: "Начать / подключить уведомления" },
          { name: "connect", description: "Подключить уведомления по коду" },
          { name: "id", description: "Узнать свой ID" },
          { name: "help", description: "Помощь" },
        ],
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("MAX set commands error:", error);
    return false;
  }
}
