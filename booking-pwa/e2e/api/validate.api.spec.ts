import { test, expect } from "@playwright/test";
import { authHeaders, expectRegistered, registerMaster } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

test.describe("API · телефон и email", () => {
  test("принимает 8XXXXXXXXXX и сохраняет +7", async ({ request }) => {
    const master = makeMaster({ phone: "89991234567" });
    const body = await expectRegistered(request, master);
    const me = await request.get("/api/masters/me", {
      headers: authHeaders(body.token),
    });
    expect(await me.json()).toMatchObject({ phone: "+79991234567" });
  });

  test("отклоняет короткий телефон", async ({ request }) => {
    const { response, body } = await registerMaster(
      request,
      makeMaster({ phone: "123" })
    );
    expect(response.status()).toBe(400);
    expect(body.error).toMatch(/телефон/i);
  });

  test("PATCH me отклоняет невалидный email", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { notify_email: "not-an-email" },
    });
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  test("PATCH me принимает mail.ru", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const res = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { notify_email: "Master.Name+tag@mail.ru" },
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).notify_email).toBe("master.name+tag@mail.ru");
  });
});
