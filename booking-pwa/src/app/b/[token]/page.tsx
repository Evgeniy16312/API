"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type BookingView = {
  id: string;
  service_name: string;
  client_name: string;
  date: string;
  time: string;
  status: string;
  master_name: string;
  master_slug: string;
  manage_token: string;
};

export default function ManageBookingPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [booking, setBooking] = useState<BookingView | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch(`/api/bookings/manage/${token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Не найдено");
        setBooking(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function cancel() {
    if (!confirm("Отменить запись?")) return;
    setCancelling(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/manage/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBooking(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c4a574] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/" className="text-[#c4a574]">
          На главную
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  const cancelled = booking.status === "cancelled";

  return (
    <div className="min-h-screen bg-[#f4f0ea]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <h1 className="text-xl font-bold text-[#1c1917]">Ваша запись</h1>
        <div className="card space-y-2" data-testid="manage-booking">
          <p className="font-semibold">{booking.master_name}</p>
          <p className="text-sm text-[#78716c]">{booking.service_name}</p>
          <p className="text-sm">
            {booking.date} в {booking.time}
          </p>
          <p className="text-sm">Клиент: {booking.client_name}</p>
          <p
            className={`text-sm font-medium ${
              cancelled ? "text-red-600" : "text-green-700"
            }`}
          >
            {cancelled ? "Отменена" : "Активна"}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
        )}

        {!cancelled && (
          <button
            type="button"
            onClick={cancel}
            disabled={cancelling}
            className="btn-outline w-full text-red-600 border-red-200"
            data-testid="client-cancel"
          >
            {cancelling ? "Отменяем..." : "Отменить запись"}
          </button>
        )}

        <Link
          href={`/m/${booking.master_slug}`}
          className="btn-primary block text-center w-full"
        >
          К странице мастера
        </Link>
      </div>
    </div>
  );
}
