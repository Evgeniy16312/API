import { test, expect } from "@playwright/test";
import {
  authHeaders,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";

test.describe("API · статус записи и outbox flush", () => {
  test("мастер подтверждает запись", async ({ request }) => {
    const { master, service, headers } = await seedMasterWithService(request);
    const date = tomorrowDate();

    const created = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Анна",
        client_phone: "+79990001122",
        date,
        time: "15:00",
      },
    });
    expect(created.status()).toBe(201);
    const { id } = await created.json();

    const patch = await request.patch(`/api/bookings/${id}`, {
      headers,
      data: { status: "confirmed" },
    });
    expect(patch.status()).toBe(200);
    const body = await patch.json();
    expect(body.status).toBe("confirmed");
  });

  test("cron flush требует ключ", async ({ request }) => {
    const denied = await request.post("/api/cron/flush");
    expect(denied.status()).toBe(403);
  });
});
