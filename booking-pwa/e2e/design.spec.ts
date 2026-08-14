import { test, expect } from "@playwright/test";
import { expectRegistered } from "./helpers/api";
import { makeMaster } from "./fixtures/master";

test.describe("UI · дизайн страницы", () => {
  test("на trial показывается апгрейд Pro", async ({ page, request }) => {
    const master = await expectRegistered(request, makeMaster());
    await page.goto("/app/login");
    await page.getByTestId("login-token").fill(master.token);
    await page.getByTestId("login-submit").click();
    await page.waitForURL("**/app");
    await page.goto("/app/design");
    await expect(page.getByTestId("design-page")).toBeVisible();
    await expect(page.getByTestId("design-locked")).toBeVisible();
    await expect(page.getByTestId("design-save")).toHaveCount(0);
  });
});
