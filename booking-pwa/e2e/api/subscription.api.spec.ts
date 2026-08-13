import { test, expect } from "@playwright/test";
import { authHeaders, expectRegistered, seedMasterWithService } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · подписка", () => {
  test("новый мастер — trial и баннер", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.subscription_status).toBe("trial");
    expect(body.booking_allowed).toBe(true);
    expect(body.subscription_banner).toMatch(/Пробный период/);
    expect(body.trial_ends_at).toBeTruthy();
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
  });
});
