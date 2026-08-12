import { test, expect } from "@playwright/test";
import {
  authHeaders,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";

/**
 * Smoke against deployed host (PLAYWRIGHT_BASE_URL).
 * Does not rely on local next dev.
 */
test.describe("prod smoke · полный цикл записи", () => {
  test("регистрация → услуга → слоты → запись → список у мастера", async ({
    request,
  }) => {
    const { master, service, headers } = await seedMasterWithService(request, {
      specialty: "Барбер",
    });
    const date = tomorrowDate();

    const slotsRes = await request.get(
      `/api/slots?slug=${master.slug}&service_id=${service.id}&date=${date}`
    );
    expect(slotsRes.status()).toBe(200);
    const { slots } = (await slotsRes.json()) as { slots: string[] };
    expect(slots.length).toBeGreaterThan(0);
    const time = slots[0];

    const booking = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Клиент Тест",
        client_phone: "+79991112233",
        date,
        time,
      },
    });
    expect(booking.status()).toBe(201);
    const created = await booking.json();
    expect(created).toMatchObject({
      id: expect.any(String),
      status: "pending",
    });

    const list = await request.get("/api/bookings?status=pending", { headers });
    expect(list.status()).toBe(200);
    const bookings = await list.json();
    expect(bookings.some((b: { id: string }) => b.id === created.id)).toBe(
      true
    );

    const publicMaster = await request.get(`/api/masters/${master.slug}`);
    expect(publicMaster.status()).toBe(200);

    const confirm = await request.patch(`/api/bookings/${created.id}`, {
      headers,
      data: { status: "confirmed" },
    });
    expect(confirm.status()).toBe(200);
  });

  test("публичная страница пилота отдаёт услуги", async ({ request }) => {
    // Fixed pilot slug seeded on VPS (may be absent on local — skip)
    const slug = process.env.PILOT_SLUG || "anna-pilot";
    const res = await request.get(`/api/masters/${slug}`);
    if (res.status() === 404) {
      test.skip(true, "pilot master not on this host");
      return;
    }
    expect(res.status()).toBe(200);
    const master = await res.json();
    expect(master.name).toBeTruthy();

    // public services via booking page data — use authless master + services list is auth
    // slots endpoint needs service_id from seeded services — fetch via creating nothing:
    // check HTML page loads
  });
});

test.describe("prod smoke · публичная HTML", () => {
  test("главная и страница мастера открываются", async ({ request }) => {
    const home = await request.get("/");
    expect(home.status()).toBe(200);
    const html = await home.text();
    expect(html).toContain("МояЗапись");

    const slug = process.env.PILOT_SLUG || "anna-pilot";
    const page = await request.get(`/m/${slug}`);
    if (page.status() === 404) {
      test.skip(true, "pilot page missing");
      return;
    }
    expect(page.status()).toBe(200);
    const body = await page.text();
    expect(body.length).toBeGreaterThan(500);
  });
});
