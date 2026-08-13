"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "@/lib/client";

export default function SubscriptionBanner() {
  const [banner, setBanner] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(true);

  useEffect(() => {
    if (!getToken()) return;
    apiFetch("/api/masters/me")
      .then(
        (m: {
          subscription_banner?: string | null;
          booking_allowed?: boolean;
        }) => {
          setBanner(m.subscription_banner || null);
          setAllowed(m.booking_allowed !== false);
        }
      )
      .catch(() => {
        /* ignore */
      });
  }, []);

  if (!banner) return null;

  return (
    <div
      data-testid="subscription-banner"
      className={`mx-4 mt-4 rounded-xl px-3 py-2 text-sm flex items-start justify-between gap-3 ${
        allowed
          ? "bg-[#c9a96e]/15 text-[#5c4a2a]"
          : "bg-red-50 text-red-700 border border-red-100"
      }`}
    >
      <span>{banner}</span>
      <Link
        href="/app/billing"
        data-testid="subscription-pay-link"
        className={`shrink-0 font-medium underline underline-offset-2 ${
          allowed ? "text-[#5c4a2a]" : "text-red-800"
        }`}
      >
        Оплатить
      </Link>
    </div>
  );
}
