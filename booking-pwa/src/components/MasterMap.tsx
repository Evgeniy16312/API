"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Props = {
  lat: number;
  lng: number;
  label?: string;
  className?: string;
  zoom?: number;
};

/** Free OpenStreetMap map — no API keys. */
export default function MasterMap({
  lat,
  lng,
  label,
  className = "h-48 w-full rounded-xl overflow-hidden z-0",
  zoom = 15,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([lat, lng], zoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;border-radius:50%;background:#c9a96e;border:3px solid #1a1a2e;box-shadow:0 2px 6px rgba(0,0,0,.25)"></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([lat, lng], { icon }).addTo(map);
    if (label) marker.bindPopup(label);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, label, zoom]);

  useEffect(() => {
    mapRef.current?.setView([lat, lng], zoom);
  }, [lat, lng, zoom]);

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="master-map"
    />
  );
}
