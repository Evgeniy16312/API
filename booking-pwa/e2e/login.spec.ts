import { test, expect } from "@playwright/test";
import { expectRegistered } from "./helpers/api";
import { makeMaster } from "./fixtures/master";

test.describe("UI · вход", () => {
  test("логин email+паролем открывает кабинет", async ({ page, request }) => {
    const master = makeMaster();
    await expectRegistered(request, master);

    await page.goto("/app/login");
    await expect(page.getByTestId("login-form")).toBeVisible();

    await page.getByTestId("login-email").fill(master.email);
    await page.getByTestId("login-password").fill(master.password);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/masters/login") &&
          res.request().method() === "POST"
      ),
      page.getByTestId("login-submit").click(),
    ]);

    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(/\/app\/?$/);
  });
});
