import { test, expect, type APIRequestContext } from "@playwright/test";
import { authHeaders, expectRegistered } from "../helpers/api";
import { makeMaster } from "../fixtures/master";
import { CLASSIC_PAGE_THEME } from "../../src/lib/page-theme";

const ADMIN_KEY = process.env.ADMIN_SETUP_KEY || "change-me";

const ROSE = {
  accent: "#c45c7a",
  background: "#fdf2f4",
  ink: "#4a1c2a",
  header: "#4a1c2a",
  card: "#fff7f8",
  font: "cormorant",
};

async function setPlan(
  request: APIRequestContext,
  masterId: string,
  plan: string
) {
  const until = new Date(Date.now() + 30 * 86400_000).toISOString();
  const res = await request.patch(`/api/admin/masters/${masterId}`, {
    headers: {
      "x-admin-key": ADMIN_KEY,
      "Content-Type": "application/json",
    },
    data: {
      plan,
      subscription_status: "active",
      paid_until: until,
    },
  });
  expect(res.status()).toBe(200);
}

test.describe("API · дизайн страницы (Pro)", () => {
  test("trial не может сохранить тему", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    const meBody = await me.json();
    expect(meBody.theme_customizable).toBe(false);

    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { page_theme: ROSE },
    });
    expect(patch.status()).toBe(403);

    const pub = await request.get(`/api/masters/${master.slug}`);
    const pubBody = await pub.json();
    expect(pubBody.theme_custom).toBe(false);
    expect(pubBody.page_theme.accent).toBe(CLASSIC_PAGE_THEME.accent);
  });

  test("Pro сохраняет тему, Basic снова классика", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    await setPlan(request, master.id, "pro");

    const me = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    expect((await me.json()).theme_customizable).toBe(true);

    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { page_theme: ROSE },
    });
    expect(patch.status()).toBe(200);
    const saved = await patch.json();
    expect(saved.page_theme.accent).toBe(ROSE.accent);
    expect(saved.page_theme.font).toBe("cormorant");

    const pubPro = await request.get(`/api/masters/${master.slug}`);
    const proBody = await pubPro.json();
    expect(proBody.theme_custom).toBe(true);
    expect(proBody.page_theme).toMatchObject(ROSE);

    const bad = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { page_theme: { accent: "red;background:url(x)", font: "Comic Sans" } },
    });
    expect(bad.status()).toBe(400);

    await setPlan(request, master.id, "basic");

    const pubBasic = await request.get(`/api/masters/${master.slug}`);
    const basicBody = await pubBasic.json();
    expect(basicBody.theme_custom).toBe(false);
    expect(basicBody.page_theme.accent).toBe(CLASSIC_PAGE_THEME.accent);

    const meBasic = await request.get("/api/masters/me", {
      headers: authHeaders(master.token),
    });
    const stored = await meBasic.json();
    expect(stored.theme_customizable).toBe(false);
    expect(stored.page_theme.accent).toBe(ROSE.accent);
  });

  test("Старт (lite) не включает свой дизайн", async ({ request }) => {
    const master = await expectRegistered(request, makeMaster());
    await setPlan(request, master.id, "lite");
    const patch = await request.patch("/api/masters/me", {
      headers: authHeaders(master.token),
      data: { page_theme: ROSE },
    });
    expect(patch.status()).toBe(403);
    const pub = await request.get(`/api/masters/${master.slug}`);
    expect((await pub.json()).theme_custom).toBe(false);
  });
});
