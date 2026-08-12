import { test, expect } from "@playwright/test";
import {
  authHeaders,
  expectRegistered,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";
import { makeMaster } from "../fixtures/master";

test.describe("API · услуги", () => {
  test("создаёт и отдаёт список услуг", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const headers = authHeaders(master.token);

    const create = await request.post("/api/services", {
      headers,
      data: { name: "Маникюр", duration: 90, price: 2000 },
    });
    expect(create.status()).toBe(201);
    const service = await create.json();
    expect(service.name).toBe("Маникюр");
    expect(service.duration).toBe(90);

    const list = await request.get("/api/services", { headers });
    expect(list.status()).toBe(200);
    const services = await list.json();
    expect(services.some((s: { id: string }) => s.id === service.id)).toBe(true);
  });

  test("без токена → 401", async ({ request }) => {
    const res = await request.get("/api/services");
    expect(res.status()).toBe(401);
  });

  test("не даёт удалить чужую услугу", async ({ request }) => {
    const a = await seedMasterWithService(request);
    const b = await expectRegistered(request, makeMaster());

    const del = await request.delete(`/api/services/${a.service.id}`, {
      headers: authHeaders(b.token),
    });
    expect(del.status()).toBe(404);
  });
});

test.describe("API · записи и слоты", () => {
  test("создаёт запись и блокирует тот же слот", async ({ request }) => {
    const { master, service } = await seedMasterWithService(request);
    const date = tomorrowDate();
    const payload = {
      slug: master.slug,
      service_id: service.id,
      client_name: "Анна",
      client_phone: "+79990001122",
      date,
      time: "11:00",
    };

    const first = await request.post("/api/bookings", { data: payload });
    expect(first.status()).toBe(201);

    const dup = await request.post("/api/bookings", {
      data: { ...payload, client_name: "Борис", client_phone: "+79990003344" },
    });
    expect(dup.status()).toBe(409);
  });

  test("слоты не содержат занятое время", async ({ request }) => {
    const { master, service } = await seedMasterWithService(request);
    const date = tomorrowDate();

    await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Анна",
        client_phone: "+79990001122",
        date,
        time: "12:00",
      },
    });

    const slotsRes = await request.get(
      `/api/slots?slug=${master.slug}&service_id=${service.id}&date=${date}`
    );
    expect(slotsRes.status()).toBe(200);
    const { slots } = (await slotsRes.json()) as { slots: string[] };
    expect(slots).not.toContain("12:00");
  });

  test("мастер видит свои записи по Bearer", async ({ request }) => {
    const { master, service, headers } = await seedMasterWithService(request);
    const date = tomorrowDate();

    await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Анна",
        client_phone: "+79990001122",
        date,
        time: "13:00",
      },
    });

    const list = await request.get("/api/bookings", { headers });
    expect(list.status()).toBe(200);
    const bookings = await list.json();
    expect(bookings.length).toBeGreaterThanOrEqual(1);
    expect(bookings[0].client_name).toBe("Анна");
  });
});

test.describe("API · сессия", () => {
  test("login по токену открывает /api/masters/me", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());

    const login = await request.post("/api/masters/login", {
      data: { token: master.token },
    });
    expect(login.status()).toBe(200);

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.slug).toBe(master.slug);
  });

  test("неверный токен login → 401", async ({ request }) => {
    const res = await request.post("/api/masters/login", {
      data: { token: "00000000-0000-0000-0000-000000000000" },
    });
    expect(res.status()).toBe(401);
  });
});
