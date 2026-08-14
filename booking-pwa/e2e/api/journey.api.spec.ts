import { test, expect } from "@playwright/test";
import {
  authHeaders,
  createPublicBooking,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

/**
 * Full product journey: master setup → client books → master confirms →
 * client cancels via manage link → admin sees master.
 */
test.describe("API · полный сценарий", () => {
  test("мастер → клиент → запись → отмена → админ", async ({ request }) => {
    const { master, service, headers } = await seedMasterWithService(request, {
      specialty: "Барбер",
    });

    const email = await request.patch("/api/masters/me", {
      headers,
      data: {
        notify_channel: "email",
        notify_email: "journey@mail.ru",
        description: "Тестовый барбер",
        work_schedule: {
          monday: { enabled: true, start: "09:00", end: "21:00" },
          tuesday: { enabled: true, start: "09:00", end: "21:00" },
          wednesday: { enabled: true, start: "09:00", end: "21:00" },
          thursday: { enabled: true, start: "09:00", end: "21:00" },
          friday: { enabled: true, start: "09:00", end: "21:00" },
          saturday: { enabled: true, start: "09:00", end: "21:00" },
          sunday: { enabled: false, start: "10:00", end: "16:00" },
        },
      },
    });
    expect(email.status()).toBe(200);

    const pub = await request.get(`/api/masters/${master.slug}`);
    expect(pub.status()).toBe(200);
    const page = await pub.json();
    expect(page.booking_enabled).toBe(true);
    expect(page.token).toBeUndefined();
    expect(page.max_user_id).toBeUndefined();
    expect(page.telegram_user_id).toBeUndefined();
    expect(page.notify_email).toBeUndefined();
    expect(page.services.some((s: { id: string }) => s.id === service.id)).toBe(
      true
    );

    const date = tomorrowDate();
    const slotsRes = await request.get(
      `/api/slots?slug=${master.slug}&service_id=${service.id}&date=${date}`
    );
    expect(slotsRes.status()).toBe(200);
    const { slots } = (await slotsRes.json()) as { slots: string[] };
    expect(slots.length).toBeGreaterThan(0);
    const time = slots.includes("14:00") ? "14:00" : slots[0];

    const booked = await createPublicBooking(request, {
      slug: master.slug,
      service_id: service.id,
      date,
      time,
      client_name: "Анна Клиент",
      client_phone: "+79001112233",
    });
    expect(booked.response.status()).toBe(201);
    expect(booked.body.manage_token).toBeTruthy();

    const list = await request.get("/api/bookings?status=pending", { headers });
    expect(list.status()).toBe(200);
    const bookings = await list.json();
    expect(bookings.some((b: { id: string }) => b.id === booked.body.id)).toBe(
      true
    );

    const confirm = await request.patch(`/api/bookings/${booked.body.id}`, {
      headers,
      data: { status: "confirmed" },
    });
    expect(confirm.status()).toBe(200);
    expect((await confirm.json()).status).toBe("confirmed");

    const manage = await request.get(
      `/api/bookings/manage/${booked.body.manage_token}`
    );
    expect(manage.status()).toBe(200);

    const cancel = await request.post(
      `/api/bookings/manage/${booked.body.manage_token}`,
      { data: { action: "cancel" } }
    );
    expect(cancel.status()).toBe(200);
    expect((await cancel.json()).status).toBe("cancelled");

    const again = await createPublicBooking(request, {
      slug: master.slug,
      service_id: service.id,
      date,
      time,
      client_name: "Другой",
      client_phone: "+79004445566",
    });
    expect(again.response.status()).toBe(201);

    const admin = await request.get("/api/admin/masters", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    expect(admin.status()).toBe(200);
    const adminBody = await admin.json();
    expect(
      (adminBody.masters as { slug: string }[]).some(
        (m) => m.slug === master.slug
      )
    ).toBe(true);
  });
});
