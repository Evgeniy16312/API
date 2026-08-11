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
        body: JSON.stringify({ name, phone, slug, specialty }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setToken(data.token);
      router.push("/app");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <Link href="/" className="text-sm text-[#c9a96e] mb-6 inline-block">
        ← На главную
      </Link>

      <h1 className="text-2xl font-bold mb-2">Создать страницу</h1>
      <p className="text-[#6b7280] mb-8">
        Займёт 2 минуты. Потом добавите услуги и портфолио.
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-[#6b7280] mb-1 block">Ваше имя</label>
          <input
            className="input"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ринат"
            required
          />
        </div>

        <div>
          <label className="text-sm text-[#6b7280] mb-1 block">Телефон</label>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+7 (999) 123-45-67"
            required
          />
        </div>

        <div>
          <label className="text-sm text-[#6b7280] mb-1 block">Специализация</label>
          <input
            className="input"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Барбер, маникюр, кондитер..."
          />
        </div>

        <div>
          <label className="text-sm text-[#6b7280] mb-1 block">
            Адрес вашей страницы
          </label>
          <div className="flex items-center gap-0">
            <span className="text-sm text-[#6b7280] bg-[#faf9f7] border border-r-0 border-[#e8e6e3] rounded-l-xl px-3 py-3">
              /m/
            </span>
            <input
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

        <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
          {loading ? "Создаём..." : "Создать страницу"}
        </button>
      </form>
    </div>
  );
}
