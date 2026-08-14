#!/usr/bin/env node
/**
 * Register MAX webhook and bot commands.
 * Usage: MAX_BOT_TOKEN=... MAX_WEBHOOK_URL=... MAX_WEBHOOK_SECRET=... node scripts/max-setup.mjs
 */

const API = "https://platform-api2.max.ru";
const token = process.env.MAX_BOT_TOKEN;
const webhookUrl = process.env.MAX_WEBHOOK_URL;
const secret = process.env.MAX_WEBHOOK_SECRET;

if (!token || !webhookUrl || !secret) {
  console.error("Set MAX_BOT_TOKEN, MAX_WEBHOOK_URL, MAX_WEBHOOK_SECRET");
  process.exit(1);
}

const headers = {
  Authorization: token,
  "Content-Type": "application/json",
};

async function main() {
  console.log("Registering webhook:", webhookUrl);

  const subRes = await fetch(`${API}/subscriptions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      url: webhookUrl,
      secret,
      update_types: ["message_created", "bot_started", "message_callback"],
    }),
  });

  const subData = await subRes.json();
  console.log("Webhook:", subRes.status, subData);

  const cmdRes = await fetch(`${API}/me/commands`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      commands: [
        { name: "start", description: "Начать / подключить уведомления" },
        { name: "connect", description: "Подключить уведомления по коду" },
        { name: "id", description: "Узнать свой ID" },
        { name: "help", description: "Помощь" },
      ],
    }),
  });

  console.log("Commands:", cmdRes.status, cmdRes.ok ? "OK" : await cmdRes.text());

  const meRes = await fetch(`${API}/me`, { headers });
  const me = await meRes.json();
  console.log("Bot:", me);
}

main().catch(console.error);
