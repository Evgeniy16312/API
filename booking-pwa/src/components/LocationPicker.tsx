"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const MasterMap = dynamic(() => import("./MasterMap"), {
  ssr: false,
  loading: () => (
    <div className="h-48 rounded-xl bg-[#faf9f7] border border-[#e8e6e3] animate-pulse" />
  ),
});

type GeoHit = { label: string; lat: number; lng: number };

type Props = {
  address: string;
  lat: number | null;
  lng: number | null;
  onChange: (next: {
    address: string;
    lat: number | null;
    lng: number | null;
  }) => void;
};

export default function LocationPicker({ address, lat, lng, onChange }: Props) {
  const [query, setQuery] = useState(address);
  const [results, setResults] = useState<GeoHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    const q = query.trim() || address.trim();
    if (q.length < 3) {
      setError("Введите адрес (минимум 3 символа)");
      return;
    }
    setSearching(true);
    setError("");
    try {
      const res = await fetch(`/api/geo/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(data.results || []);
      if (!(data.results || []).length) {
        setError("Адрес не найден — попробуйте уточнить город");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка поиска");
    } finally {
      setSearching(false);
    }
  }

  function pick(hit: GeoHit) {
    onChange({ address: hit.label, lat: hit.lat, lng: hit.lng });
    setQuery(hit.label);
    setResults([]);
  }

  function clearPin() {
    onChange({ address: query, lat: null, lng: null });
  }

  return (
    <div className="space-y-3" data-testid="location-picker">
      <div>
        <label className="text-xs text-[#6b7280]" htmlFor="location-address">
          Адрес на карте (бесплатно, OpenStreetMap)
        </label>
        <div className="flex gap-2 mt-1">
          <input
            id="location-address"
            data-testid="location-query"
            className="input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange({ address: e.target.value, lat, lng });
            }}
            placeholder="Город, улица, дом"
          />
          <button
            type="button"
            onClick={search}
            disabled={searching}
            className="btn-outline shrink-0 px-4"
            data-testid="location-search"
          >
            {searching ? "…" : "Найти"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {results.length > 0 && (
        <ul className="border border-[#e8e6e3] rounded-xl overflow-hidden divide-y divide-[#e8e6e3]">
          {results.map((hit) => (
            <li key={`${hit.lat}-${hit.lng}-${hit.label}`}>
              <button
                type="button"
                className="w-full text-left text-sm px-3 py-2 hover:bg-[#faf9f7]"
                onClick={() => pick(hit)}
              >
                {hit.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {lat != null && lng != null ? (
        <div className="space-y-2">
          <MasterMap lat={lat} lng={lng} label={address || query} />
          <button type="button" className="text-sm text-[#6b7280]" onClick={clearPin}>
            Убрать метку с карты
          </button>
        </div>
      ) : (
        <p className="text-xs text-[#6b7280]">
          Нажмите «Найти» и выберите адрес — на странице появится карта для клиентов.
        </p>
      )}
    </div>
  );
}
