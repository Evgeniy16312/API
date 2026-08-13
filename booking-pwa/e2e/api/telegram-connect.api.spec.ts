import { test, expect } from "@playwright/test";
import { authHeaders, expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

test.describe("API · Telegram connect", () => {
  test("выдаёт код подключения и статус", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const headers = authHeaders(master.token);

    const before = await request.get("/api/telegram/connect", { headers });
    expect(before.status()).toBe(200);
    const beforeBody = await before.json();
    expect(beforeBody.connected).toBe(false);

    const created = await request.post("/api/telegram/connect", { headers });
    expect(created.status()).toBe(200);
    const body = await created.json();
    expect(body.code).toMatch(/^[A-F0-9]{6}$/);
    expect(body.connect_command).toBe(`/connect ${body.code}`);
    expect(body.bot_url).toContain("t.me/");

    const status = await request.get("/api/telegram/connect", { headers });
    expect(status.status()).toBe(200);
    const statusBody = await status.json();
    expect(statusBody.pending_code).toBe(body.code);
  });

  test("webhook /connect связывает мастера", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const headers = authHeaders(master.token);

    const created = await request.post("/api/telegram/connect", { headers });
    const { code } = await created.json();
    const tgUserId = 700000000 + Math.floor(Math.random() * 100000);

    const webhook = await request.post("/api/telegram/webhook", {
      data: {
        update_id: 1,
        message: {
          text: `/connect ${code}`,
          from: { id: tgUserId, first_name: "Test" },
          chat: { id: tgUserId },
        },
      },
    });
    expect(webhook.status()).toBe(200);

    const me = await request.get("/api/masters/me", { headers });
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.telegram_user_id).toBe(String(tgUserId));

    const status = await request.get("/api/telegram/connect", { headers });
    expect((await status.json()).connected).toBe(true);
  });

  test("setup без admin key → 403", async ({ request }) => {
    const res = await request.post("/api/telegram/setup");
    expect(res.status()).toBe(403);
  });
});
