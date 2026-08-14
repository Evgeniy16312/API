import { test, expect } from "@playwright/test";
import { authHeaders, expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";

test.describe("API · смена slug", () => {
  test("мастер меняет адрес страницы", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const headers = authHeaders(master.token);
    const nextSlug = `new${Date.now().toString(36)}`.slice(0, 20);

    const patch = await request.patch("/api/masters/me", {
      headers,
      data: { slug: nextSlug },
    });
    expect(patch.status()).toBe(200);
    const body = await patch.json();
    expect(body.slug).toBe(nextSlug);

    const pub = await request.get(`/api/masters/${nextSlug}`);
    expect(pub.status()).toBe(200);

    const old = await request.get(`/api/masters/${master.slug}`);
    expect(old.status()).toBe(404);
  });

  test("занятый slug → 409", async ({ request }) => {
    const a = await expectRegistered(request, makeMaster());
    const b = await expectRegistered(request, makeMaster());

    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(b.token),
      data: { slug: a.slug },
    });
    expect(patch.status()).toBe(409);
  });

  test("невалидный slug → 400", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { slug: "аб" },
    });
    expect(patch.status()).toBe(400);
  });
});
