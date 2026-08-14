import { test, expect } from "@playwright/test";
import { expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · master expiry reminders (F36)", () => {
  test("за 2 дня до конца — одно напоминание, повтор дедупится", async ({
    request,
  }) => {
    const master = await expectRegistered(request, makeMaster());

    // Exactly +2 UTC calendar days from "today"
    const now = new Date();
    const until = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 2,
        15,
        0,
        0
      )
    );

    const patch = await request.patch(`/api/admin/masters/${master.id}`, {
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      data: {
        plan: "basic",
        subscription_status: "active",
        paid_until: until.toISOString(),
        notify_channel: "email",
        notify_email: "master-expiry@example.com",
      },
    });
    expect(patch.status()).toBe(200);

    const first = await request.post("/api/cron/flush", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    expect(first.status()).toBe(200);
    const b1 = await first.json();
    expect(b1.master_expiry_alerts).toBeTruthy();
    expect(
      b1.master_expiry_alerts.sent,
      JSON.stringify(b1.master_expiry_alerts)
    ).toBeGreaterThanOrEqual(1);

    const second = await request.post("/api/cron/flush", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    const b2 = await second.json();
    expect(b2.master_expiry_alerts.sent).toBe(0);
    expect(b2.master_expiry_alerts.skipped_dup).toBeGreaterThanOrEqual(1);
  });
});
