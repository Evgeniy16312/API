"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
      setTimeout(() => router.push("/app/login"), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сменить пароль");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-red-50 text-red-600 text-sm p-4 rounded-lg" data-testid="reset-invalid">
        Ссылка недействительна. Запросите новую на странице восстановления.
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-green-50 text-green-800 text-sm p-4 rounded-lg" data-testid="reset-success">
        Пароль обновлён. Сейчас перенаправим на вход…
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="reset-form">
      <div>
        <label className="text-sm text-[#78716c] mb-1 block" htmlFor="reset-password">
          Новый пароль
        </label>
        <PasswordInput
          id="reset-password"
          data-testid="reset-password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          minLength={8}
          required
        />
      </div>

      <div>
        <label className="text-sm text-[#78716c] mb-1 block" htmlFor="reset-confirm">
          Повторите пароль
        </label>
        <PasswordInput
          id="reset-confirm"
          data-testid="reset-confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          minLength={8}
          required
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full mt-4"
        data-testid="reset-submit"
      >
        {loading ? "Сохраняем..." : "Сохранить пароль"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="px-6 py-8">
      <Link href="/app/login" className="text-sm font-semibold text-[#9a7b4a] mb-6 inline-flex items-center min-h-11">
        ← К входу
      </Link>

      <h1 className="text-2xl font-bold mb-2">Новый пароль</h1>
      <p className="text-[#78716c] mb-8">
        Придумайте новый пароль для входа по email.
      </p>

      <Suspense fallback={<p className="text-sm text-[#78716c]">Загрузка…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
