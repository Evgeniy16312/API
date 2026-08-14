import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PLAYWRIGHT_PORT || 3100);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "api",
      testMatch: /.*\.api\.spec\.ts/,
    },
    {
      name: "chromium",
      testIgnore: /.*\.api\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: `npx next dev --webpack --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
        env: {
          ...process.env,
          PORT: String(PORT),
          ADMIN_SETUP_KEY:
            process.env.ADMIN_SETUP_KEY || "change-me",
          OWNER_ALERTS_DRY_RUN: "1",
          MASTER_EXPIRY_DRY_RUN: "1",
          BILLING_MOCK: "1",
          SMTP_HOST: "",
          SMTP_USER: "",
          SMTP_PASS: "",
          TELEGRAM_WEBHOOK_SECRET: "",
          AUTH_RETURN_RESET_TOKEN: "1",
        },
      },
});
