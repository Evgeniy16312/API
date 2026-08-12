"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, getToken } from "@/lib/client";
import QRShare from "@/components/QRShare";
import { masterPublicPageUrl } from "@/lib/public-url";
import type { Master, Booking } from "@/lib/types";

export default function AppDashboard() {
  const router = useRouter();
  const [master, setMaster] = useState<Master | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/app/login");
      return;
    }

    Promise.all([
      apiFetch("/api/masters/me"),
      apiFetch("/api/bookings?status=pending"),
    ])
      .then(([m, b]) => {
        setMaster(m);
        setBookings(b);
      })
      .catch(() => router.replace("/app/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!master) return null;

  const pageUrl = masterPublicPageUrl(master.slug);

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Привет, {master.name.split(" ")[0]}!</h1>
          <p className="text-sm text-[#6b7280]">Ваша панель управления</p>
        </div>
        <Link href="/app/settings" className="text-2xl">⚙️</Link>
      </div>

      <QRShare url={pageUrl} slug={master.slug} />

      {bookings.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Новые записи</h3>
            <Link href="/app/bookings" className="text-sm text-[#c9a96e]">
              Все →
            </Link>
          </div>
          {bookings.slice(0, 3).map((b) => (
            <div
              key={b.id}
              className="flex justify-between items-center py-2 border-b border-[#e8e6e3] last:border-0"
            >
              <div>
                <p className="font-medium text-sm">{b.client_name}</p>
                <p className="text-xs text-[#6b7280]">
                  {b.service_name} · {b.date} {b.time}
                </p>
              </div>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Новая
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/services" className="card text-center py-4 active:scale-[0.98] transition-transform">
          <span className="text-2xl block mb-1">✂️</span>
          <span className="text-sm font-medium">Услуги</span>
        </Link>
        <Link href="/app/portfolio" className="card text-center py-4 active:scale-[0.98] transition-transform">
          <span className="text-2xl block mb-1">🖼️</span>
          <span className="text-sm font-medium">Портфолио</span>
        </Link>
        <Link href="/app/schedule" className="card text-center py-4 active:scale-[0.98] transition-transform">
          <span className="text-2xl block mb-1">📅</span>
          <span className="text-sm font-medium">Календарь</span>
        </Link>
        <Link href="/app/reviews" className="card text-center py-4 active:scale-[0.98] transition-transform">
          <span className="text-2xl block mb-1">⭐</span>
          <span className="text-sm font-medium">Отзывы</span>
        </Link>
        <Link href="/app/settings" className="card text-center py-4 active:scale-[0.98] transition-transform">
          <span className="text-2xl block mb-1">🔔</span>
          <span className="text-sm font-medium">MAX / VK</span>
        </Link>
        <Link href="/app/bookings" className="card text-center py-4 active:scale-[0.98] transition-transform">
          <span className="text-2xl block mb-1">📋</span>
          <span className="text-sm font-medium">Записи</span>
        </Link>
      </div>
    </div>
  );
}
