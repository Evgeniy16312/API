"use client";

import { useState } from "react";
import type { Review } from "@/lib/types";

type Props = {
  slug: string;
  initialReviews: Review[];
};

export default function ReviewsSection({ slug, initialReviews }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setOk(false);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          client_name: name,
          rating,
          text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка");
      setReviews((prev) => [data, ...prev]);
      setName("");
      setText("");
      setRating(5);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card space-y-4" data-testid="reviews-section">
      <h2 className="font-semibold">Отзывы</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-[#6b7280]">Пока нет отзывов — будьте первым</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="border border-[#e8e6e3] rounded-xl p-3"
              data-testid="review-item"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm">{r.client_name}</span>
                <span className="text-[#c9a96e] text-sm" aria-label={`${r.rating} из 5`}>
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </span>
              </div>
              {r.text && (
                <p className="text-sm text-[#6b7280] leading-relaxed">{r.text}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={submit} className="space-y-3 border-t border-[#e8e6e3] pt-4">
        <p className="text-sm font-medium">Оставить отзыв</p>
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-2 rounded-lg">{error}</div>
        )}
        {ok && (
          <div className="bg-green-50 text-green-700 text-sm p-2 rounded-lg">
            Спасибо за отзыв!
          </div>
        )}
        <input
          className="input"
          data-testid="review-name"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="flex gap-2" data-testid="review-rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`w-10 h-10 rounded-lg border text-lg ${
                n <= rating
                  ? "border-[#c9a96e] bg-[#c9a96e]/15 text-[#c9a96e]"
                  : "border-[#e8e6e3] text-[#d1d5db]"
              }`}
              aria-label={`${n} звёзд`}
            >
              ★
            </button>
          ))}
        </div>
        <textarea
          className="input min-h-[80px] resize-none"
          data-testid="review-text"
          placeholder="Как всё прошло? (необязательно)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={sending || !name.trim()}
          className="btn-primary w-full"
          data-testid="review-submit"
        >
          {sending ? "Отправляем..." : "Отправить отзыв"}
        </button>
      </form>
    </div>
  );
}
