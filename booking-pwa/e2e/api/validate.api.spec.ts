import { test, expect } from "@playwright/test";
import {
  authHeaders,
  expectRegistered,
  registerMaster,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · телефон и email", () => {
  test("принимает 8XXXXXXXXXX и сохраняет +7", async ({ request }) => {
    const master = makeMaster({ phone: "89991234567" });
    const body = await expectRegistered(request, master);
    const me = await request.get("/api/masters/me", {
      headers: authHeaders(body.token),
    });
    expect(await me.json()).toMatchObject({ phone: "+79991234567" });
  });

  test("отклоняет короткий телефон", async ({ request }) => {
    const { response, body } = await registerMaster(
      request,
      makeMaster({ phone: "123" })
    );
    expect(response.status()).toBe(400);
    expect(body.error).toMatch(/телефон/i);
  });

  test("PATCH me отклоняет невалидный email", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { notify_email: "not-an-email" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  test("PATCH me принимает mail.ru", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { notify_email: "Master.Name+tag@mail.ru" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).notify_email).toBe("master.name+tag@mail.ru");
  });
});

test.describe("API · услуга: длительность и цена", () => {
  test("отклоняет слишком короткую длительность", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.post("/api/services", {
      headers: authHeaders(master.token),
      data: { name: "Тест", duration: 5, price: 1000 },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/длительность/i);
  });

  test("отклоняет цену выше 100 000", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.post("/api/services", {
      headers: authHeaders(master.token),
      data: { name: "Тест", duration: 60, price: 100_001 },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/100/);
  });

  test("принимает цену 100 000", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.post("/api/services", {
      headers: authHeaders(master.token),
      data: { name: "VIP", duration: 120, price: 100_000 },
    });
    expect(res.status()).toBe(201);
    expect((await res.json()).price).toBe(100_000);
  });
});

test.describe("API · лимит заказов в день", () => {
  test("Старт блокирует 4-ю запись в один день", async ({ request }) => {
    const { master, service } = await seedMasterWithService(request);
    await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: {
        plan: "lite",
        subscription_status: "active",
        paid_until: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
    });

    const date = tomorrowDate();
    const times = ["10:00", "11:00", "12:00", "13:00"];
    for (let i = 0; i < 3; i++) {
      const res = await request.post("/api/bookings", {
        data: {
          slug: master.slug,
          service_id: service.id,
          client_name: `Клиент ${i + 1}`,
          client_phone: `+7999000112${i}`,
          date,
          time: times[i],
        },
      });
      expect(res.status(), await res.text()).toBe(201);
    }

    const blocked = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Клиент 4",
        client_phone: "+79990001124",
        date,
        time: times[3],
      },
    });
    expect(blocked.status()).toBe(403);
    expect((await blocked.json()).error).toMatch(/3 заказ/i);
  });
});
