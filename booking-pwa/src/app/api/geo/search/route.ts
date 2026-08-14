import {
  buildPhotonSearchUrl,
  mapPhotonResults,
  type PhotonResponse,
} from "@/lib/geo";
import { jsonError, jsonOk } from "@/lib/http";

/** Free geocoding via Photon (Komoot): addresses in Russia only. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return jsonError("Введите адрес (минимум 3 символа)", 400);
  }

  try {
    const url = buildPhotonSearchUrl(q);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json", "Accept-Language": "ru" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return jsonError("Сервис карт временно недоступен", 502);
    }

    const data = (await res.json()) as PhotonResponse;
    const results = mapPhotonResults(data);

    if (results.length === 0) {
      return jsonOk({
        results: [],
        hint: "Уточните город и улицу — ищем только адреса в России",
      });
    }

    return jsonOk({ results });
  } catch (error) {
    console.error("Geo search error:", error);
    return jsonError("Ошибка поиска адреса", 500);
  }
}
