import { test, expect } from "@playwright/test";
import { authHeaders, expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

test.describe("API · канал уведомлений", () => {
  test("по умолчанию max; можно выбрать vk, telegram и email", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    const headers = authHeaders(master.token);

    const me = await request.get("/api/masters/me", { headers });
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.notify_channel).toBe("max");
    expect(body.notify_email).toBe("");
    expect(body.telegram_user_id).toBe("");

    const toVk = await request.patch("/api/masters/me", {
      headers,
      data: { notify_channel: "vk", vk_user_id: "100500" },
    });
    expect(toVk.status()).toBe(200);
    expect((await toVk.json()).notify_channel).toBe("vk");

    const toTg = await request.patch("/api/masters/me", {
      headers,
      data: { notify_channel: "telegram" },
    });
    expect(toTg.status()).toBe(200);
    expect((await toTg.json()).notify_channel).toBe("telegram");

    const toEmail = await request.patch("/api/masters/me", {
      headers,
      data: {
        notify_channel: "email",
        notify_email: "master@mail.ru",
      },
    });
    expect(toEmail.status()).toBe(200);
    const emailBody = await toEmail.json();
    expect(emailBody.notify_channel).toBe("email");
    expect(emailBody.notify_email).toBe("master@mail.ru");
  });

  test("неизвестный канал → 400", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { notify_channel: "whatsapp" },
    });
    expect(patch.status()).toBe(400);
  });

  test("некорректный email → 400", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { notify_email: "not-an-email" },
    });
    expect(patch.status()).toBe(400);
  });
});
