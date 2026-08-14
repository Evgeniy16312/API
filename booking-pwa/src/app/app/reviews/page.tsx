"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import type { Review } from "@/lib/types";

export default function ReviewsManagePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/reviews")
      .then(setReviews)
      .finally(() => setLoading(false));
  }, []);

  async function hide(id: string) {
    const updated = await apiFetch(`/api/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "hidden" }),
    });
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  async function publish(id: string) {
    const updated = await apiFetch(`/api/reviews/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "published" }),
    });
    setReviews((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c4a574] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <Link href="/app" className="text-sm text-[#c4a574]">
        ← Назад
      </Link>
      <h1 className="text-xl font-bold">Отзывы</h1>

      {reviews.length === 0 ? (
        <p className="text-[#78716c] text-sm">Пока нет отзывов</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="card space-y-2" data-testid="master-review">
              <div className="flex justify-between">
                <span className="font-medium">{r.client_name}</span>
                <span className="text-[#c4a574]">
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              {r.text && <p className="text-sm text-[#78716c]">{r.text}</p>}
              <p className="text-xs text-[#9ca3af]">
                {r.status === "hidden" ? "Скрыт" : "Опубликован"}
              </p>
              {r.status === "published" ? (
                <button
                  type="button"
                  className="btn-outline w-full text-sm"
                  onClick={() => hide(r.id)}
                  data-testid="review-hide"
                >
                  Скрыть
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-outline w-full text-sm"
                  onClick={() => publish(r.id)}
                >
                  Показать снова
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
