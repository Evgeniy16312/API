"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotAccessPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);

    try {
      const res = await fetch("/api/auth/forgot-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить письмо");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <Link href="/app/login" className="text-sm font-semibold text-[#9a7b4a] mb-6 inline-flex items-center min-h-11">
        ← К входу
      </Link>

      <h1 className="text-2xl font-bold mb-2">Восстановление доступа</h1>
      <p className="text-[#78716c] mb-8">
        Укажите email регистрации — пришлём письмо с напоминанием логина и ссылкой для нового пароля.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {sent ? (
        <div className="bg-green-50 text-green-800 text-sm p-4 rounded-lg" data-testid="forgot-success">
          Если email зарегистрирован, письмо уже отправлено. Проверьте «Входящие» и «Спам».
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="forgot-form">
          <div>
            <label className="text-sm text-[#78716c] mb-1 block" htmlFor="forgot-email">
              Email
            </label>
            <input
              id="forgot-email"
              data-testid="forgot-email"
              type="email"
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@mail.ru"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-4"
            data-testid="forgot-submit"
          >
            {loading ? "Отправляем..." : "Отправить письмо"}
          </button>
        </form>
      )}
    </div>
  );
}
