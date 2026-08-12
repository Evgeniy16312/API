import { test, expect } from "@playwright/test";
import { expectRegistered } from "./helpers/api";
import { makeMaster } from "./fixtures/master";

test.describe("UI · вход по коду", () => {
  test("логин токеном открывает кабинет", async ({ page, request }) => {
    const master = await expectRegistered(request, makeMaster());

    await page.goto("/app/login");
    await expect(page.getByTestId("login-form")).toBeVisible();

    await page.getByTestId("login-token").fill(master.token);

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
