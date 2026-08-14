import { test, expect } from "@playwright/test";
import { makeMaster } from "../fixtures/master";
import {
  expectRegistered,
  loginWithPassword,
  registerMaster,
} from "../helpers/api";

test.describe("API · email и пароль", () => {
  test("вход по email и паролю после регистрации", async ({ request }) => {
    const master = makeMaster();
    const registered = await expectRegistered(request, master);

    const { response, body } = await loginWithPassword(
      request,
      master.email,
      master.password
    );
    expect(response.status()).toBe(200);
    expect(body.token).toBe(registered.token);
  });

  test("отклоняет неверный пароль", async ({ request }) => {
    const input = makeMaster();
    await expectRegistered(request, input);

    const { response, body } = await loginWithPassword(
      request,
      input.email,
      "WrongPass9"
    );
    expect(response.status()).toBe(401);
    expect(body.error).toMatch(/неверн/i);
  });

  test("восстановление: reset token и смена пароля", async ({ request }) => {
    const input = makeMaster();
    await expectRegistered(request, input);

    const forgot = await request.post("/api/auth/forgot-access", {
      data: { email: input.email },
    });
    expect(forgot.status()).toBe(200);
    const forgotBody = await forgot.json();
    expect(forgotBody.reset_token).toBeTruthy();

    const newPassword = "NewPass99";
    const reset = await request.post("/api/auth/reset-password", {
      data: { token: forgotBody.reset_token, password: newPassword },
    });
    expect(reset.status()).toBe(200);

    const badOld = await loginWithPassword(request, input.email, input.password);
    expect(badOld.response.status()).toBe(401);

    const goodNew = await loginWithPassword(request, input.email, newPassword);
    expect(goodNew.response.status()).toBe(200);
  });

  test("регистрация отклоняет занятый email", async ({ request }) => {
    const master = makeMaster();
    await expectRegistered(request, master);

    const { response, body } = await registerMaster(request, {
      ...makeMaster(),
      email: master.email,
    });
    expect(response.status()).toBe(409);
    expect(body.error).toMatch(/email/i);
  });

  test("регистрация требует пароль", async ({ request }) => {
    const master = makeMaster({ password: "short" });
    const { response, body } = await registerMaster(request, master);
    expect(response.status()).toBe(400);
    expect(body.error).toMatch(/парол/i);
  });
});
