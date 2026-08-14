import { test, expect } from "@playwright/test";
import {
  authHeaders,
  createPublicBooking,
  expectRegistered,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

test.describe("API · health / geo / logout", () => {
  test("health отдаёт ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe(true);
  });

  test("geo без запроса → 400", async ({ request }) => {
    const res = await request.get("/api/geo/search?q=ab");
    expect(res.status()).toBe(400);
  });

  test("logout → 200", async ({ request }) => {
    const res = await request.post("/api/masters/logout");
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });
});

test.describe("API · изоляция и валидация записи", () => {
  test("пустые поля записи → 400", async ({ request }) => {
    const res = await request.post("/api/bookings", { data: {} });
    expect(res.status()).toBe(400);
  });

  test("невалидный телефон клиента → 400", async ({ request }) => {
    const { master, service } = await seedMasterWithService(request);
    const res = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Аня",
        client_phone: "12",
        date: tomorrowDate(),
        time: "11:00",
      },
    });
    expect(res.status()).toBe(400);
  });

  test("мастер не видит чужие записи и не меняет их статус", async ({
    request,
  }) => {
    const a = await seedMasterWithService(request);
    const b = await expectRegistered(request, makeMaster());
    const date = tomorrowDate();
    const created = await createPublicBooking(request, {
      slug: a.master.slug,
      service_id: a.service.id,
      date,
      time: "10:00",
    });
    expect(created.response.status()).toBe(201);

    const list = await request.get("/api/bookings", {
      headers: authHeaders(b.token),
    });
    expect(list.status()).toBe(200);
    const bookings = await list.json();
    expect(bookings.some((row: { id: string }) => row.id === created.body.id)).toBe(
      false
    );

    const steal = await request.patch(`/api/bookings/${created.body.id}`, {
      headers: authHeaders(b.token),
      data: { status: "cancelled" },
    });
    expect(steal.status()).toBe(404);
  });

  test("перекрытие по длительности, не только точное HH:mm", async ({
    request,
  }) => {
    const { master, service } = await seedMasterWithService(
      request,
      {},
      { duration: 60 }
    );
    const date = tomorrowDate();
    const first = await createPublicBooking(request, {
      slug: master.slug,
      service_id: service.id,
      date,
      time: "11:00",
    });
    expect(first.response.status()).toBe(201);

    const overlap = await createPublicBooking(request, {
      slug: master.slug,
      service_id: service.id,
      date,
      time: "11:30",
      client_name: "Второй",
      client_phone: "+79002223344",
    });
    expect(overlap.response.status()).toBe(409);
  });

  test("manage с неизвестным токеном → 404", async ({ request }) => {
    const res = await request.get("/api/bookings/manage/notarealtoken000");
    expect(res.status()).toBe(404);
  });
});

test.describe("API · профиль, слоты, портфолио", () => {
  test("клиент не может выставить max_user_id через PATCH", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: {
        name: master.name,
        max_user_id: "hacked",
        telegram_user_id: "hacked",
      },
    });
    expect(patch.status()).toBe(200);

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    const body = await me.json();
    expect(body.max_user_id || "").not.toBe("hacked");
    expect(body.telegram_user_id || "").not.toBe("hacked");
  });

  test("слоты без date отдают календарь дат", async ({ request }) => {
    const { master, service } = await seedMasterWithService(request);
    const res = await request.get(
      `/api/slots?slug=${master.slug}&service_id=${service.id}`
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.dates)).toBe(true);
    expect(body.dates.length).toBeGreaterThan(0);
  });

  test("несуществующий мастер → 404", async ({ request }) => {
    const res = await request.get("/api/masters/no-such-master-zzz");
    expect(res.status()).toBe(404);
  });

  test("портфолио: загрузка, публичка, чужой не удалит", async ({
    request,
  }) => {
    const a = await seedMasterWithService(request);
    const create = await request.post("/api/portfolio", {
      headers: a.headers,
      data: { image_url: TINY_PNG, caption: "Работа" },
    });
    expect(create.status()).toBe(201);
    const item = await create.json();
    expect(item.image_url).toMatch(/^\/uploads\//);

    const img = await request.get(item.image_url);
    expect(img.status()).toBe(200);
    expect(img.headers()["content-type"]).toMatch(/^image\//);

    const pub = await request.get(`/api/masters/${a.master.slug}`);
    const page = await pub.json();
    expect(page.portfolio.some((p: { id: string }) => p.id === item.id)).toBe(
      true
    );

    const b = await expectRegistered(request, makeMaster());
    const del = await request.delete(`/api/portfolio/${item.id}`, {
      headers: authHeaders(b.token),
    });
    expect(del.status()).toBe(404);
  });

  test("аватар сохраняется как файл на сервере", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const headers = authHeaders(master.token);

    const patch = await request.patch("/api/masters/me", {
      headers,
      data: { avatar_url: TINY_PNG },
    });
    expect(patch.status()).toBe(200);
    const body = await patch.json();
    expect(body.avatar_url).toMatch(/^\/uploads\/.+\/avatar\/.+\.png$/);

    const avatar = await request.get(body.avatar_url);
    expect(avatar.status()).toBe(200);
    expect(avatar.headers()["content-type"]).toMatch(/^image\//);

    const me = await request.get("/api/masters/me", { headers });
    expect((await me.json()).avatar_url).toBe(body.avatar_url);
  });
});

test.describe("API · billing transfer + admin filter", () => {
  test("plans в mock/transfer отдают тарифы 99/249/499", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.get("/api/billing/plans", {
      headers: authHeaders(master.token),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(["mock", "yookassa", "transfer"]).toContain(body.mode);
    const prices = (body.plans as { id: string; price_rub: number }[]).map(
      (p) => p.price_rub
    );
    expect(prices).toContain(99);
    expect(prices).toContain(249);
    expect(prices).toContain(499);
    const lite = (body.plans as { id: string; title: string }[]).find(
      (p) => p.id === "lite"
    );
    expect(lite?.title).toBe("Тариф «Старт»");
    expect((body.plans as { id: string }[]).map((p) => p.id)).toEqual([
      "lite",
      "basic",
      "pro",
    ]);
  });

  test("админ фильтр по slug находит мастера", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.get(
      `/api/admin/masters?q=${encodeURIComponent(master.slug)}`,
      { headers: { "x-admin-key": ADMIN_KEY } }
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(
      (body.masters as { slug: string }[]).some((m) => m.slug === master.slug)
    ).toBe(true);
  });
});
