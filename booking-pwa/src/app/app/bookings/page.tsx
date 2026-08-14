"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import type { Booking } from "@/lib/types";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadBookings();
  }, [filter]);

  async function loadBookings() {
    setLoading(true);
    try {
      const url =
        filter === "all" ? "/api/bookings" : `/api/bookings?status=${filter}`;
      const data = await apiFetch(url);
      setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    await apiFetch(`/api/bookings/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadBookings();
  }

  const statusLabel: Record<string, string> = {
    pending: "Новая",
    confirmed: "Подтверждена",
    cancelled: "Отменена",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold">Записи</h1>

      <div className="flex gap-2 overflow-x-auto">
        {[
          { key: "all", label: "Все" },
          { key: "pending", label: "Новые" },
          { key: "confirmed", label: "Подтверждённые" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 min-h-11 rounded-full text-sm font-semibold whitespace-nowrap ${
              filter === f.key
                ? "bg-[#1c1917] text-white"
                : "bg-[#fffcf8] border border-[#e7e0d6]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-[#c4a574] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-[#78716c]">Записей пока нет</p>
          <p className="text-sm text-[#78716c] mt-1">
            Поделитесь ссылкой с клиентами
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-medium">{b.client_name}</p>
                  <a
                    href={`tel:${b.client_phone}`}
                    className="text-sm text-[#c4a574]"
                  >
                    {b.client_phone}
                  </a>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${statusColor[b.status]}`}
                >
                  {statusLabel[b.status]}
                </span>
              </div>
              <p className="text-sm text-[#78716c]">
                {b.service_name} · {b.date} в {b.time}
              </p>
              {b.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateStatus(b.id, "confirmed")}
                    className="btn-primary flex-1 text-sm py-2"
                  >
                    Подтвердить
                  </button>
                  <button
                    onClick={() => updateStatus(b.id, "cancelled")}
                    className="btn-outline flex-1 text-sm py-2"
                  >
                    Отменить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
