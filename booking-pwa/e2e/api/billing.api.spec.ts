import { test, expect } from "@playwright/test";
import { authHeaders, expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · billing (F31)", () => {
  test("plans + mock checkout продлевает подписку", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());

    const plans = await request.get("/api/billing/plans", {
      headers: authHeaders(master.token),
    });
    expect(plans.status()).toBe(200);
    const plansBody = await plans.json();
    expect(plansBody.plans.length).toBeGreaterThanOrEqual(1);
    expect(plansBody.plans[0].price_rub).toBeGreaterThan(0);
    expect(["mock", "yookassa", "transfer"]).toContain(plansBody.mode);

    const checkout = await request.post("/api/billing/checkout", {
      headers: authHeaders(master.token),
      data: { plan: "basic" },
    });
    expect(checkout.status()).toBe(200);
    const pay = await checkout.json();
    expect(pay.payment_id).toBeTruthy();
    expect(pay.mock).toBe(true);
    expect(pay.confirmation_url).toContain("mock_pay=");

    const succeed = await request.post("/api/billing/mock/succeed", {
      headers: authHeaders(master.token),
      data: { payment_id: pay.payment_id },
    });
    expect(succeed.status()).toBe(200);

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    expect(me.status()).toBe(200);
    const body = await me.json();
    expect(body.subscription_status).toBe("active");
    expect(body.plan).toBe("basic");
    expect(body.booking_allowed).toBe(true);
    expect(body.paid_until).toBeTruthy();

    // idempotent second succeed
    const again = await request.post("/api/billing/mock/succeed", {
      headers: authHeaders(master.token),
      data: { payment_id: pay.payment_id },
    });
    expect(again.status()).toBe(200);
  });

  test("yookassa webhook payment.succeeded применяет оплату", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    const checkout = await request.post("/api/billing/checkout", {
      headers: authHeaders(master.token),
      data: { plan: "pro" },
    });
    expect(checkout.status()).toBe(200);
    const pay = await checkout.json();

    const webhook = await request.post("/api/billing/yookassa/webhook", {
      data: {
        event: "payment.succeeded",
        object: {
          id: `ext_${pay.payment_id}`,
          status: "succeeded",
          metadata: {
            payment_id: pay.payment_id,
            master_id: master.id,
            plan: "pro",
          },
        },
      },
    });
    expect(webhook.status()).toBe(200);
    const wh = await webhook.json();
    expect(wh.ok).toBe(true);

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    const body = await me.json();
    expect(body.plan).toBe("pro");
    expect(body.subscription_status).toBe("active");
  });

  test("past_due мастер может оплатить и снова принимать записи", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: { subscription_status: "past_due" },
    });

    const checkout = await request.post("/api/billing/checkout", {
      headers: authHeaders(master.token),
      data: { plan: "basic" },
    });
    const pay = await checkout.json();
    await request.post("/api/billing/mock/succeed", {
      headers: authHeaders(master.token),
      data: { payment_id: pay.payment_id },
    });

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    expect((await me.json()).booking_allowed).toBe(true);
  });
});
