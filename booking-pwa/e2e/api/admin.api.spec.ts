import { test, expect } from "@playwright/test";
import { expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · админка", () => {
  test("без ключа → 403", async ({ request }) => {
    const res = await request.get("/api/admin/masters");
    expect(res.status()).toBe(403);
  });

  test("список и смена канала / блокировка", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());

    const list = await request.get("/api/admin/masters", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    expect(list.status()).toBe(200);
    const body = await list.json();
    expect(
      (body.masters as { slug: string }[]).some((m) => m.slug === master.slug)
    ).toBe(true);

    const patch = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: {
        notify_channel: "telegram",
        plan: "basic",
        subscription_status: "active",
        paid_until: "2027-01-01T00:00:00.000Z",
      },
    });
    expect(patch.status()).toBe(200);
    const updated = await patch.json();
    expect(updated.notify_channel).toBe("telegram");
    expect(updated.plan).toBe("basic");
    expect(updated.subscription_status).toBe("active");

    const block = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: { blocked: true },
    });
    expect(block.status()).toBe(200);
    expect((await block.json()).blocked).toBe(true);

    const extend = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: { extend_days: 30 },
    });
    expect(extend.status()).toBe(200);
    const extended = await extend.json();
    expect(extended.subscription_status).toBe("active");
    expect(extended.blocked).toBe(false);
    expect(extended.paid_until).toBeTruthy();
  });
});
