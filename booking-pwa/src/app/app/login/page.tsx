"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken } from "@/lib/client";

export default function LoginPage() {
  const router = useRouter();
  const [token, setTokenInput] = useState("");
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
        body: JSON.stringify({ token: token.trim() }),
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
      <Link href="/" className="text-sm text-[#c9a96e] mb-6 inline-block">
        ← На главную
      </Link>

      <h1 className="text-2xl font-bold mb-2">Войти в кабинет</h1>
      <p className="text-[#6b7280] mb-8">
        Вставьте код доступа — он выдаётся при регистрации и хранится в
        Настройках.
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
          <label
            className="text-sm text-[#6b7280] mb-1 block"
            htmlFor="login-token"
          >
            Код доступа
          </label>
          <input
            id="login-token"
            data-testid="login-token"
            className="input font-mono text-sm"
            value={token}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            required
            autoComplete="off"
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

      <p className="text-center text-sm text-[#6b7280] mt-6">
        Нет страницы?{" "}
        <Link href="/app/register" className="text-[#c9a96e] font-medium">
          Создать
        </Link>
      </p>
    </div>
  );
}
