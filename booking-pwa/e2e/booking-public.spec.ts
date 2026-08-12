import { test, expect } from "@playwright/test";

const PILOT = process.env.PILOT_SLUG || "anna-pilot";

test.describe("UI · публичная запись (пилот)", () => {
  test("клиент выбирает услугу, дату, время и записывается", async ({
    page,
  }) => {
    await page.goto(`/m/${PILOT}`);
    await expect(page.getByRole("heading", { name: /Анна Пилот|dfsdfsdf/ })).toBeVisible({
      timeout: 15_000,
    });

    // service
    const serviceBtn = page.getByRole("button", {
      name: /Маникюр классический|Педикюр|Покрытие/,
    }).first();
    await expect(serviceBtn).toBeVisible();
    await serviceBtn.click();

    // pick first available day in calendar grid (not month nav)
    const dayBtn = page
      .locator('[data-testid="month-calendar"] .grid.grid-cols-7 button:not([disabled])')
      .first();
    await expect(dayBtn).toBeVisible({ timeout: 10_000 });
    await dayBtn.click();

    // pick a free slot (skip 10:00 if taken — any slot)
    const slot = page.locator("button.slot-btn").first();
    await expect(slot).toBeVisible({ timeout: 10_000 });
    await slot.click();

    await page.getByPlaceholder("Иван").fill("Елена UI");
    await page.getByPlaceholder("+7 (999) 123-45-67").fill("+79005554433");

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes("/api/bookings") && r.request().method() === "POST"
      ),
      page.getByRole("button", { name: "Записаться" }).click(),
    ]);

    await expect(page.getByText("Вы записаны!")).toBeVisible({ timeout: 10_000 });
  });
});
