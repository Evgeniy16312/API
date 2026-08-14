import { test, expect } from "@playwright/test";
import {
  authHeaders,
  seedMasterWithService,
  tomorrowDate,
} from "../helpers/api";

test.describe("API · отзывы", () => {
  test("клиент оставляет отзыв на публичной странице", async ({ request }) => {
    const { master } = await seedMasterWithService(request);

    const create = await request.post("/api/reviews", {
      data: {
        slug: master.slug,
        client_name: "Оля",
        rating: 5,
        text: "Отлично!",
      },
    });
    expect(create.status()).toBe(201);
    const review = await create.json();
    expect(review.rating).toBe(5);
    expect(review.status).toBe("published");

    const pub = await request.get(`/api/masters/${master.slug}`);
    expect(pub.status()).toBe(200);
    const body = await pub.json();
    expect(body.reviews.some((r: { id: string }) => r.id === review.id)).toBe(
      true
    );
  });

  test("мастер скрывает отзыв", async ({ request }) => {
    const { master, headers } = await seedMasterWithService(request);
    const created = await request.post("/api/reviews", {
      data: { slug: master.slug, client_name: "Игорь", rating: 2, text: "Так себе" },
    });
    const review = await created.json();

    const hide = await request.patch(`/api/reviews/${review.id}`, {
      headers,
      data: { status: "hidden" },
    });
    expect(hide.status()).toBe(200);

    const pub = await request.get(`/api/masters/${master.slug}`);
    const body = await pub.json();
    expect(body.reviews.some((r: { id: string }) => r.id === review.id)).toBe(
      false
    );
  });

  test("невалидная оценка → 400", async ({ request }) => {
    const { master } = await seedMasterWithService(request);
    const res = await request.post("/api/reviews", {
      data: { slug: master.slug, client_name: "Аня", rating: 9 },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("API · отмена клиентом", () => {
  test("клиент отменяет по manage_token, слот снова свободен", async ({
    request,
  }) => {
    const { master, service } = await seedMasterWithService(request);
    const date = tomorrowDate();

    const created = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Клиент",
        client_phone: "+79990001122",
        date,
        time: "16:00",
      },
    });
    expect(created.status()).toBe(201);
    const { manage_token } = await created.json();
    expect(manage_token).toBeTruthy();

    const view = await request.get(`/api/bookings/manage/${manage_token}`);
    expect(view.status()).toBe(200);

    const cancel = await request.post(`/api/bookings/manage/${manage_token}`, {
      data: { action: "cancel" },
    });
    expect(cancel.status()).toBe(200);
    const cancelled = await cancel.json();
    expect(cancelled.status).toBe("cancelled");

    const again = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Другой",
        client_phone: "+79990003344",
        date,
        time: "16:00",
      },
    });
    expect(again.status()).toBe(201);
  });

  test("повторная отмена → 409", async ({ request }) => {
    const { master, service } = await seedMasterWithService(request);
    const date = tomorrowDate();
    const created = await request.post("/api/bookings", {
      data: {
        slug: master.slug,
        service_id: service.id,
        client_name: "Клиент",
        client_phone: "+79990001122",
        date,
        time: "17:00",
      },
    });
    const { manage_token } = await created.json();
    await request.post(`/api/bookings/manage/${manage_token}`, {
      data: { action: "cancel" },
    });
    const second = await request.post(`/api/bookings/manage/${manage_token}`, {
      data: { action: "cancel" },
    });
    expect(second.status()).toBe(409);
  });
});
