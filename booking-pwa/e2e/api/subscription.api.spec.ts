import { test, expect } from "@playwright/test";
import { authHeaders, expectRegistered, seedMasterWithService } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · подписка", () => {
  test("новый мастер — trial, статус в настройках, без баннера", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.subscription_status).toBe("trial");
    expect(body.booking_allowed).toBe(true);
    expect(body.subscription_banner).toBeNull();
    expect(body.subscription_status_line).toMatch(/Пробный период/);
    expect(body.trial_ends_at).toBeTruthy();
  });

  test("активная подписка >3 дней — без баннера, статус в me", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    const extend = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: { extend_days: 30 },
    });
    expect(extend.status()).toBe(200);

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    const body = await me.json();
    expect(body.subscription_status).toBe("active");
    expect(body.subscription_banner).toBeNull();
    expect(body.subscription_status_line).toMatch(/Подписка активна до/);
    expect(body.subscription_status_line).toMatch(/осталось \d+ дн/);
  });

  test("активная подписка ≤3 дней — баннер с напоминанием", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    const inTwoDays = new Date();
    inTwoDays.setUTCDate(inTwoDays.getUTCDate() + 2);
    const paidUntil = inTwoDays.toISOString().slice(0, 10);

    const patch = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: {
        subscription_status: "active",
        paid_until: paidUntil,
      },
    });
    expect(patch.status()).toBe(200);

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    const body = await me.json();
    expect(body.subscription_banner).toMatch(/Подписка.*остал/);
    expect(body.subscription_status_line).toMatch(/Подписка активна до/);
  });

  test("past_due блокирует публичную запись", async ({ request }) => {
    const { master, service } = await seedMasterWithService(request);

    const pastDue = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: { subscription_status: "past_due" },
    });
    expect(pastDue.status()).toBe(200);

    const book = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Клиент",
        client_phone: "+79001234567",
        date: "2099-06-01",
        time: "12:00",
      },
    });
    expect(book.status()).toBe(403);

    const pub = await request.get(`/api/masters/${master.slug}`);
    expect(pub.status()).toBe(200);
    const pubBody = await pub.json();
    expect(pubBody.booking_enabled).toBe(false);
    expect(pubBody.telegram_user_id).toBeUndefined();
    expect(pubBody.max_user_id).toBeUndefined();
  });

  test("past_due после +30 дней в админке — баннер и блок записи", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());

    await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: { extend_days: 30 },
    });

    await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: { subscription_status: "past_due" },
    });

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.subscription_status).toBe("past_due");
    expect(body.booking_allowed).toBe(false);
    expect(body.subscription_banner).toMatch(/истекла|Не оплачено/i);
  });
});
