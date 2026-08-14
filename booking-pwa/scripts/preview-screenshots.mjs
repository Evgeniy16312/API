#!/usr/bin/env node
import { chromium, devices } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.PREVIEW_BASE || "http://localhost:3000";
const OUT = path.resolve("preview-screenshots");

const PAGES = [
  { name: "01-landing", path: "/", auth: false },
  { name: "02-register", path: "/app/register", auth: false },
  { name: "03-login", path: "/app/login", auth: false },
  { name: "04-dashboard", path: "/app", auth: true },
  { name: "05-bookings", path: "/app/bookings", auth: true },
  { name: "06-schedule", path: "/app/schedule", auth: true },
  { name: "07-services", path: "/app/services", auth: true },
  { name: "08-settings", path: "/app/settings", auth: true },
  { name: "09-billing", path: "/app/billing", auth: true },
  { name: "10-design", path: "/app/design", auth: true },
  { name: "11-portfolio", path: "/app/portfolio", auth: true },
  { name: "12-reviews", path: "/app/reviews", auth: true },
];

async function registerMaster() {
  const slug = `preview-${Date.now()}`;
  const res = await fetch(`${BASE}/api/masters/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Превью Мастер",
      phone: "+79991234567",
      slug,
      specialty: "Барбер",
    }),
  });
  if (!res.ok) throw new Error(`register failed: ${await res.text()}`);
  const body = await res.json();
  return { token: body.token, slug: body.slug };
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const { token, slug } = await registerMaster();
  PAGES.push({
    name: "13-client-page",
    path: `/m/${slug}`,
    auth: false,
  });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    locale: "ru-RU",
  });

  for (const page of PAGES) {
    const p = await context.newPage();
    if (page.auth) {
      await p.addInitScript((t) => {
        localStorage.setItem("master_token", t);
      }, token);
    }
    await p.goto(`${BASE}${page.path}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    const file = path.join(OUT, `${page.name}.png`);
    await p.screenshot({ path: file, fullPage: true });
    await p.close();
    console.log("saved", file);
  }

  await writeFile(
    path.join(OUT, "README.txt"),
    `Preview ${new Date().toISOString()}\nBase: ${BASE}\nClient: /m/${slug}\n`
  );

  await browser.close();
  console.log(`\nDone → ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
