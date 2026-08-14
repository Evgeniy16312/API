import { test, expect } from "@playwright/test";
import {
  createPublicBooking,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";

test.describe("API · календарь мастера", () => {
  test("занятый слот после записи и подтверждения", async ({ request }) => {
    const { master, service, headers } = await seedMasterWithService(request);
    const date = tomorrowDate();

    const { time } = await createPublicBooking(request, {
      slug: master.slug,
      service_id: service.id,
      date,
      time: "12:00",
    });

    const list = await request.get("/api/bookings", { headers });
    const bookings = await list.json();
    const booking = bookings.find(
      (b: { time: string }) => b.time === time
    );
    expect(booking).toBeTruthy();

    const confirm = await request.patch(`/api/bookings/${booking.id}`, {
      headers,
      data: { status: "confirmed" },
    });
    expect(confirm.status()).toBe(200);

    const publicSlots = await request.get(
      `/api/slots?slug=${master.slug}&service_id=${service.id}&date=${date}`
    );
    const { slots } = await publicSlots.json();
    expect(slots).not.toContain(time);

    const masterView = await request.get(
      `/api/masters/schedule/slots?date=${date}&service_id=${service.id}`,
      { headers }
    );
    expect(masterView.status()).toBe(200);
    const body = await masterView.json();
    const slot12 = body.overview.find(
      (s: { time: string }) => s.time === time
    );
    expect(slot12?.status).toBe("busy");
    expect(body.free).not.toContain(time);
  });

  test("отмена освобождает слот", async ({ request }) => {
    const { master, service, headers } = await seedMasterWithService(request);
    const date = tomorrowDate();

    await createPublicBooking(request, {
      slug: master.slug,
      service_id: service.id,
      date,
      time: "11:00",
    });

    const list = await request.get("/api/bookings", { headers });
    const booking = (await list.json())[0];

    await request.patch(`/api/bookings/${booking.id}`, {
      headers,
      data: { status: "cancelled" },
    });

    const masterView = await request.get(
      `/api/masters/schedule/slots?date=${date}&service_id=${service.id}`,
      { headers }
    );
    const body = await masterView.json();
    const slot11 = body.overview.find(
      (s: { time: string }) => s.time === "11:00"
    );
    expect(slot11?.status).toBe("free");
  });
});
