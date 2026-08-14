/** Russia-only geocoding (Photon / Komoot) + shared geo types. */

export type GeoResult = {
  label: string;
  lat: number;
  lng: number;
};

export type PhotonProperties = {
  name?: string;
  street?: string;
  housenumber?: string;
  city?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  postcode?: string;
};

export type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
};

export type PhotonResponse = {
  features: PhotonFeature[];
};

/** minLon,minLat,maxLon,maxLat — Russia */
export const RU_BBOX = "19.6,41.2,169.0,81.9";

export function buildPhotonSearchUrl(query: string): URL {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");
  url.searchParams.set("bbox", RU_BBOX);
  return url;
}

export function formatPhotonAddress(
  props: PhotonProperties,
  fallback: string
): string {
  const locality = props.city || props.state || "";
  const streetLine = [props.street, props.housenumber].filter(Boolean).join(", ");
  const named = props.name && props.name !== locality ? props.name : "";

  const parts = [locality, streetLine || named].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return props.name || fallback;
}

export function mapPhotonResults(data: PhotonResponse): GeoResult[] {
  return (data.features || [])
    .filter((f) => {
      const code = f.properties.countrycode?.toUpperCase();
      return !code || code === "RU";
    })
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      const props = f.properties;
      const fallback = [props.name, props.city, props.country]
        .filter(Boolean)
        .join(", ");
      return {
        label: formatPhotonAddress(props, fallback),
        lat,
        lng,
      };
    });
}

/** Neutral map tiles (CARTO Voyager) — no API key. */
export const MAP_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

export const MAP_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function yandexMapsUrl(lat: number, lng: number): string {
  return `https://yandex.ru/maps/?ll=${lng}%2C${lat}&pt=${lng}%2C${lat}&z=16&l=map`;
}
