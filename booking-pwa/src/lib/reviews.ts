import { v4 as uuidv4 } from "uuid";
import { getMasterBySlug } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { Review } from "@/lib/types";

export type CreateReviewInput = {
  slug: string;
  client_name: string;
  rating: number;
  text?: string;
  booking_id?: string;
};

export type CreateReviewResult =
  | { ok: true; review: Review }
  | { ok: false; error: string; status: number };

export function listPublishedReviews(masterId: string): Review[] {
  return getDb()
    .prepare(
      `SELECT id, master_id, booking_id, client_name, rating, text, status, created_at
       FROM reviews
       WHERE master_id = ? AND status = 'published'
       ORDER BY created_at DESC
       LIMIT 50`
    )
    .all(masterId) as unknown as Review[];
}

export function createReview(input: CreateReviewInput): CreateReviewResult {
  const name = (input.client_name || "").trim();
  const text = (input.text || "").trim();
  const rating = Number(input.rating);

  if (!input.slug || !name) {
    return { ok: false, error: "Укажите имя", status: 400 };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Оценка от 1 до 5", status: 400 };
  }
  if (text.length > 1000) {
    return { ok: false, error: "Текст слишком длинный", status: 400 };
  }

  const master = getMasterBySlug(input.slug);
  if (!master) {
    return { ok: false, error: "Мастер не найден", status: 404 };
  }

  const bookingId = (input.booking_id || "").trim();
  if (bookingId) {
    const booking = getDb()
      .prepare(
        "SELECT id FROM bookings WHERE id = ? AND master_id = ? AND status != 'cancelled'"
      )
      .get(bookingId, master.id);
    if (!booking) {
      return { ok: false, error: "Запись не найдена", status: 404 };
    }
    const exists = getDb()
      .prepare("SELECT id FROM reviews WHERE booking_id = ?")
      .get(bookingId);
    if (exists) {
      return { ok: false, error: "Отзыв по этой записи уже есть", status: 409 };
    }
  }

  const id = uuidv4();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO reviews (id, master_id, booking_id, client_name, rating, text, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'published', ?)`
    )
    .run(id, master.id, bookingId, name, rating, text, now);

  const review = getDb()
    .prepare("SELECT * FROM reviews WHERE id = ?")
    .get(id) as unknown as Review;

  return { ok: true, review };
}

export function setReviewStatus(
  reviewId: string,
  masterId: string,
  status: "published" | "hidden"
): Review | null {
  const row = getDb()
    .prepare("SELECT * FROM reviews WHERE id = ? AND master_id = ?")
    .get(reviewId, masterId);
  if (!row) return null;

  getDb()
    .prepare("UPDATE reviews SET status = ? WHERE id = ?")
    .run(status, reviewId);

  return getDb()
    .prepare("SELECT * FROM reviews WHERE id = ?")
    .get(reviewId) as unknown as Review;
}

export function listMasterReviews(masterId: string): Review[] {
  return getDb()
    .prepare(
      `SELECT * FROM reviews WHERE master_id = ? ORDER BY created_at DESC LIMIT 100`
    )
    .all(masterId) as unknown as Review[];
}
