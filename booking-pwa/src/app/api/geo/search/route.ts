import { jsonError, jsonOk } from "@/lib/http";

export type GeoResult = {
  label: string;
  lat: number;
  lng: number;
};

/** Free geocoding via OpenStreetMap Nominatim (no API key). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return jsonError("Введите адрес (минимум 3 символа)", 400);
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "0");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "MoyaZapisBookingPWA/0.1 (local master booking)",
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return jsonError("Сервис карт временно недоступен", 502);
    }

    const data = (await res.json()) as {
      display_name: string;
      lat: string;
      lon: string;
    }[];

    const results: GeoResult[] = data.map((item) => ({
      label: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));

    return jsonOk({ results });
  } catch (error) {
    console.error("Geo search error:", error);
    return jsonError("Ошибка поиска адреса", 500);
  }
}
