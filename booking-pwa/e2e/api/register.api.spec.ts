import { test, expect } from "@playwright/test";
import { makeMaster } from "../fixtures/master";
import { expectRegistered, registerMaster } from "../helpers/api";

test.describe("API · регистрация мастера", () => {
  test("создаёт мастера с валидными данными", async ({ request }) => {
    const master = makeMaster();
    const body = await expectRegistered(request, master);
    expect(body.slug).toBe(master.slug);
  });

  test("отклоняет занятый slug", async ({ request }) => {
    const master = makeMaster();
    await expectRegistered(request, master);

    const { response, body } = await registerMaster(request, master);
    expect(response.status()).toBe(409);
    expect(body.error).toMatch(/занят/i);
  });

  test("отклоняет невалидный телефон", async ({ request }) => {
    const master = makeMaster({ phone: "123" });
    const { response, body } = await registerMaster(request, master);
    expect(response.status()).toBe(400);
    expect(body.error).toMatch(/телефон/i);
  });

  test("отклоняет короткий slug", async ({ request }) => {
    const master = makeMaster({ slug: "ab" });
    const { response, body } = await registerMaster(request, master);
    expect(response.status()).toBe(400);
    expect(body.error).toMatch(/адрес/i);
  });
});
