import { test, expect } from "@playwright/test";
import { makeMaster } from "./fixtures/master";

test.describe("UI · регистрация мастера", () => {
  test("открывает форму, заполняет поля и создаёт страницу", async ({
    page,
  }) => {
    const master = makeMaster();

    await page.goto("/app/register");
    await expect(page.getByTestId("register-form")).toBeVisible();

    // Name first — auto-slug runs, then we overwrite with unique test slug
    await page.getByTestId("register-name").fill(master.name);
    await page.getByTestId("register-phone").fill(master.phone);
    await page.getByTestId("register-specialty").fill(master.specialty);
    await page.getByTestId("register-slug").fill(master.slug);

    await expect(page.getByTestId("register-name")).toHaveValue(master.name);
    await expect(page.getByTestId("register-phone")).toHaveValue(master.phone);
    await expect(page.getByTestId("register-slug")).toHaveValue(master.slug);

    const [response] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes("/api/masters/register") &&
          res.request().method() === "POST"
      ),
      page.getByTestId("register-submit").click(),
    ]);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.slug).toBe(master.slug);
    expect(body.token).toBeTruthy();

    await expect(page).toHaveURL(/\/app\/?$/);
  });
});
