"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken } from "@/lib/client";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/masters/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToken(data.token);
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <Link href="/" className="text-sm font-semibold text-[#9a7b4a] mb-6 inline-flex items-center min-h-11">
        ← На главную
      </Link>

      <h1 className="text-2xl font-bold mb-2">Войти</h1>
      <p className="text-[#78716c] mb-8">
        Email и пароль, которые вы указали при регистрации.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
        data-testid="login-form"
      >
        <div>
          <label className="text-sm text-[#78716c] mb-1 block" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            data-testid="login-email"
            type="email"
            autoComplete="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@mail.ru"
            required
          />
        </div>

        <div>
          <label className="text-sm text-[#78716c] mb-1 block" htmlFor="login-password">
            Пароль
          </label>
          <PasswordInput
            id="login-password"
            data-testid="login-password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-4"
          data-testid="login-submit"
        >
          {loading ? "Входим..." : "Войти"}
        </button>
      </form>

      <p className="text-center text-sm mt-4">
        <Link
          href="/app/forgot-access"
          className="text-[#9a7b4a] font-semibold"
          data-testid="forgot-access-link"
        >
          Забыли email или пароль?
        </Link>
      </p>

      <p className="text-center text-sm text-[#78716c] mt-6">
        Нет страницы?{" "}
        <Link href="/app/register" className="text-[#9a7b4a] font-semibold">
          Создать
        </Link>
      </p>
    </div>
  );
}
