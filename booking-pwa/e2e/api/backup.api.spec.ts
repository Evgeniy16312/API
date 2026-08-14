import { test, expect } from "@playwright/test";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

test.describe("API · sqlite backup (F35)", () => {
  test("cron backup создаёт файл и отвечает ok", async ({ request }) => {
    const first = await request.post("/api/cron/backup", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    expect(first.status()).toBe(200);
    const body = await first.json();
    expect(body.ok).toBe(true);
    expect(body.file).toMatch(/^booking-\d{8}-\d{9}\.db$/);
    expect(body.bytes).toBeGreaterThan(0);
    expect(Array.isArray(body.recent)).toBe(true);
    expect(body.recent.length).toBeGreaterThanOrEqual(1);

    const second = await request.post("/api/cron/backup", {
      headers: { "x-admin-key": ADMIN_KEY },
    });
    expect(second.status()).toBe(200);
    const body2 = await second.json();
    expect(body2.ok).toBe(true);
    expect(body2.file).not.toBe(body.file);
  });

  test("без ключа — 403", async ({ request }) => {
    const res = await request.post("/api/cron/backup");
    expect(res.status()).toBe(403);
  });
});
