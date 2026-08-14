import { test, expect } from "@playwright/test";
import {
  buildPhotonSearchUrl,
  formatPhotonAddress,
  mapPhotonResults,
} from "../../src/lib/geo";

test.describe("API · geo search (Россия)", () => {
  test("короткий запрос → 400", async ({ request }) => {
    const res = await request.get("/api/geo/search?q=ab");
    expect(res.status()).toBe(400);
  });

  test("Москва — находит адрес в России", async ({ request }) => {
    const res = await request.get(
      "/api/geo/search?q=" + encodeURIComponent("Москва")
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.results?.length).toBeGreaterThan(0);
    const first = body.results[0];
    expect(first.lat).toBeGreaterThan(40);
    expect(first.lat).toBeLessThan(70);
    expect(first.lng).toBeGreaterThan(30);
    expect(first.lng).toBeLessThan(150);
  });
});

test.describe("lib/geo", () => {
  test("photon URL ограничен bbox Россией", () => {
    const url = buildPhotonSearchUrl("Казань");
    expect(url.hostname).toBe("photon.komoot.io");
    expect(url.searchParams.get("bbox")).toBe("19.6,41.2,169.0,81.9");
  });

  test("форматирует русский адрес", () => {
    const label = formatPhotonAddress(
      {
        city: "Казань",
        street: "Баумана",
        housenumber: "10",
        countrycode: "RU",
      },
      "fallback"
    );
    expect(label).toBe("Казань, Баумана, 10");
  });

  test("отбрасывает не-RU результаты", () => {
    const mapped = mapPhotonResults({
      features: [
        {
          geometry: { coordinates: [30.52, 50.45] },
          properties: { countrycode: "UA", city: "Kyiv", name: "Kyiv" },
        },
        {
          geometry: { coordinates: [37.61, 55.75] },
          properties: { countrycode: "RU", city: "Москва", name: "Москва" },
        },
      ],
    });
    expect(mapped).toHaveLength(1);
    expect(mapped[0].label).toMatch(/Москва/);
  });
});
