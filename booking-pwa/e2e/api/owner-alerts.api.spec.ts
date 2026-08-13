import { test, expect } from "@playwright/test";
import { expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · owner subscription alerts", () => {
  test("cron находит истекающую подписку и дедупит повтор", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());
    const until = new Date(Date.now() + 2 * 86400_000).toISOString();

    const patch = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: {
        plan: "basic",
        subscription_status: "active",
        paid_until: until,
      },
    });
    expect(patch.status()).toBe(200);

    const first = await request.post("/api/cron/flush", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    expect(first.status()).toBe(200);
    const body1 = await first.json();
    expect(body1.owner_alerts).toBeTruthy();
    expect(body1.owner_alerts.candidates).toBeGreaterThanOrEqual(1);
    expect(body1.owner_alerts.new).toBeGreaterThanOrEqual(1);
    expect(body1.owner_alerts.sent).toBe(true);

    const second = await request.post("/api/cron/flush", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    expect(second.status()).toBe(200);
    const body2 = await second.json();
    expect(body2.owner_alerts.new).toBe(0);
    expect(body2.owner_alerts.skipped).toBe("none_new");
  });
});
