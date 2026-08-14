"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setToken } from "@/lib/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleNameChange(value: string) {
    setName(value);
    if (!slug) {
      const auto = value
        .toLowerCase()
        .replace(/[а-яё]/g, (c) => {
          const map: Record<string, string> = {
            а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e",
            ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
            н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
            ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
            ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
          };
          return map[c] || "";
        })
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
        .slice(0, 20);
      setSlug(auto);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/masters/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, phone, slug, specialty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToken(data.token);
      router.push("/app");
    } catch (e) {
      if (e instanceof TypeError && String(e).includes("fetch")) {
        setError("Сервер остановился. Перезапустите в терминале: npm run dev");
      } else {
        setError(e instanceof Error ? e.message : "Ошибка регистрации");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <Link href="/" className="text-sm font-semibold text-[#9a7b4a] mb-6 inline-flex items-center min-h-11">
        ← На главную
      </Link>

      <h1 className="text-2xl font-bold mb-2">Создать страницу</h1>
      <p className="text-[#78716c] mb-8">
        Займёт 2 минуты. Потом добавите услуги и портфолио.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
        <div>
          <label className="text-sm text-[#78716c] mb-1 block" htmlFor="register-name">
            Ваше имя
          </label>
          <input
            id="register-name"
            data-testid="register-name"
            className="input"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ринат"
            required
          />
        </div>

        <div>
          <label className="text-sm text-[#78716c] mb-1 block" htmlFor="register-phone">
            Телефон
          </label>
          <input
            id="register-phone"
            data-testid="register-phone"
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
            required
          />
        </div>

        <div>
          <label className="text-sm text-[#78716c] mb-1 block" htmlFor="register-specialty">
            Специализация
          </label>
          <input
            id="register-specialty"
            data-testid="register-specialty"
            className="input"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Барбер, маникюр, кондитер..."
          />
        </div>

        <div>
          <label className="text-sm text-[#78716c] mb-1 block" htmlFor="register-slug">
            Адрес вашей страницы
          </label>
          <div className="flex items-center gap-0">
            <span className="text-sm text-[#78716c] bg-[#f4f0ea] border border-r-0 border-[#e7e0d6] rounded-l-xl px-3 py-3">
              /m/
            </span>
            <input
              id="register-slug"
              data-testid="register-slug"
              className="input rounded-l-none"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
              }
              placeholder="rinat"
              required
              minLength={3}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-4"
          data-testid="register-submit"
        >
          {loading ? "Создаём..." : "Создать страницу"}
        </button>
      </form>

      <p className="text-center text-sm text-[#78716c] mt-6">
        Уже есть страница?{" "}
        <Link href="/app/login" className="text-[#9a7b4a] font-semibold">
          Войти по коду
        </Link>
      </p>
    </div>
  );
}
