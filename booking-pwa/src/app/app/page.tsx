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
        <div className="w-8 h-8 border-2 border-[#c4a574] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!master) return null;

  const pageUrl = masterPublicPageUrl(master.slug);
  const firstName = master.name.split(" ")[0];

  return (
    <div className="px-4 py-5 space-y-4">
      <div>
        <p className="text-sm text-[#78716c]">Кабинет</p>
        <h1 className="text-2xl font-bold tracking-tight">Привет, {firstName}</h1>
      </div>

      <section className="card">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Новые записи</h2>
          <Link href="/app/bookings" className="text-sm font-semibold text-[#9a7b4a]">
            Все
          </Link>
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-[#78716c] py-2">
            Пока пусто. Отправьте ссылку клиенту — запись появится здесь.
          </p>
        ) : (
          bookings.slice(0, 4).map((b) => (
            <Link
              key={b.id}
              href="/app/bookings"
              className="flex justify-between items-center py-3 border-t border-[#e7e0d6] first:border-0 min-h-14"
            >
              <div>
                <p className="font-medium">{b.client_name}</p>
                <p className="text-sm text-[#78716c]">
                  {b.service_name} · {b.date} {b.time}
                </p>
              </div>
              <span className="text-xs font-semibold bg-[#c4a574]/20 text-[#9a7b4a] px-2.5 py-1 rounded-full shrink-0">
                Новая
              </span>
            </Link>
          ))
        )}
      </section>

      <QRShare url={pageUrl} slug={master.slug} />

      <div className="grid grid-cols-2 gap-3">
        <Link href="/app/portfolio" className="card text-center py-5 active:scale-[0.98] transition-transform min-h-24">
          <span className="text-xl block mb-1">Портфолио</span>
          <span className="text-xs text-[#78716c]">Фото работ</span>
        </Link>
        <Link href="/app/reviews" className="card text-center py-5 active:scale-[0.98] transition-transform min-h-24">
          <span className="text-xl block mb-1">Отзывы</span>
          <span className="text-xs text-[#78716c]">Оценки клиентов</span>
        </Link>
        <Link href="/app/design" className="card text-center py-5 active:scale-[0.98] transition-transform min-h-24">
          <span className="text-xl block mb-1">Дизайн</span>
          <span className="text-xs text-[#78716c]">
            {master.plan === "pro" ? "Цвета страницы" : "Классика · Pro"}
          </span>
        </Link>
        <Link href="/app/billing" className="card text-center py-5 active:scale-[0.98] transition-transform min-h-24">
          <span className="text-xl block mb-1">Подписка</span>
          <span className="text-xs text-[#78716c]">от 149 ₽ / мес</span>
        </Link>
        <Link href="/app/settings" className="card text-center py-5 active:scale-[0.98] transition-transform min-h-24">
          <span className="text-xl block mb-1">Профиль</span>
          <span className="text-xs text-[#78716c]">Почта и ссылка</span>
        </Link>
      </div>
    </div>
  );
}
