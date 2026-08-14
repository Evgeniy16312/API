import { test, expect } from "@playwright/test";
import { seedMasterWithService } from "./helpers/api";

test.describe("UI · публичная запись", () => {
  test("клиент выбирает услугу, дату, время и записывается", async ({
    page,
    request,
  }) => {
    const { master, service } = await seedMasterWithService(request, {
      name: "Анна UI",
    });

    await page.goto(`/m/${master.slug}`);
    await expect(page.getByRole("heading", { name: master.name })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId("booking-service").filter({ hasText: service.name }).click();

    const dayBtn = page
      .locator(
        '[data-testid="month-calendar"] .grid.grid-cols-7 button:not([disabled])'
      )
      .first();
    await expect(dayBtn).toBeVisible({ timeout: 10_000 });
    await dayBtn.click();

    await expect(page.getByTestId("booking-slot").first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("booking-slot").first().click();

    await page.getByTestId("booking-client-name").fill("Елена UI");
    await page.getByTestId("booking-client-phone").fill("+79005554433");

    const [response] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes("/api/bookings") && r.request().method() === "POST"
      ),
      page.getByTestId("booking-submit").click(),
    ]);

    expect(response.status()).toBe(201);
    await expect(page.getByTestId("booking-done")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByText("Вы записаны!")).toBeVisible();
  });
});
