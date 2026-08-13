"use client";

import { useEffect, useState } from "react";
import { apiFetch, getToken } from "@/lib/client";

export default function SubscriptionBanner() {
  const [banner, setBanner] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (!getToken()) return;
    apiFetch("/api/masters/me")
      .then((m: { subscription_banner?: string | null; booking_allowed?: boolean }) => {
        setBanner(m.subscription_banner || null);
        setAllowed(m.booking_allowed !== false);
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  if (!banner) return null;

  return (
    <div
      data-testid="subscription-banner"
      className={`mx-4 mt-4 rounded-xl px-3 py-2 text-sm ${
        allowed
          ? "bg-[#c9a96e]/15 text-[#5c4a2a]"
          : "bg-red-50 text-red-700 border border-red-100"
      }`}
    >
      {banner}
    </div>
  );
}
