"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import type { Service } from "@/lib/types";
import {
  SERVICE_DURATION_MAX,
  SERVICE_DURATION_MIN,
  SERVICE_PRICE_MAX,
  digitsInput,
  parseServiceDuration,
  parseServicePrice,
} from "@/lib/validate";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
  const [durationError, setDurationError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    try {
      const data = await apiFetch("/api/services");
      setServices(data);
    } finally {
      setLoading(false);
    }
  }

  async function addService(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setDurationError("");
    setPriceError("");

    const durationParsed = parseServiceDuration(duration);
    if (!durationParsed.ok) {
      setDurationError(durationParsed.error);
      return;
    }
    const priceParsed = parseServicePrice(price);
    if (!priceParsed.ok) {
      setPriceError(priceParsed.error);
      return;
    }

    setAdding(true);
    try {
      await apiFetch("/api/services", {
        method: "POST",
        body: JSON.stringify({
          name,
          duration: durationParsed.value,
          price: priceParsed.value,
        }),
      });
      setName("");
      setDuration("60");
      setPrice("");
      await loadServices();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Не удалось добавить услугу");
    } finally {
      setAdding(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Удалить услугу?")) return;
    await apiFetch(`/api/services/${id}`, { method: "DELETE" });
    await loadServices();
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
      <h1 className="text-xl font-bold">Услуги</h1>
      <p className="text-sm text-[#78716c]">
        Клиенты выбирают услугу при записи
      </p>

      {services.length > 0 && (
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="card flex justify-between items-center">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-[#78716c]">
                  {s.duration} мин{s.price > 0 ? ` · ${s.price} ₽` : ""}
                </p>
              </div>
              <button
                onClick={() => deleteService(s.id)}
                className="text-red-500 text-sm px-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addService} className="card space-y-3">
        <h3 className="font-semibold">Добавить услугу</h3>
        {formError && (
          <div className="rounded-xl bg-red-50 text-red-600 text-sm px-3 py-2">
            {formError}
          </div>
        )}
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Стрижка, маникюр, торт..."
          required
        />
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="text-xs text-[#78716c]">Длительность (мин)</label>
            <input
              className={`input ${durationError ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""}`}
              type="text"
              inputMode="numeric"
              data-testid="service-duration"
              value={duration}
              onChange={(e) => {
                setDuration(
                  digitsInput(e.target.value, 4, SERVICE_DURATION_MAX)
                );
                setDurationError("");
              }}
              placeholder="60"
              aria-invalid={Boolean(durationError)}
            />
            <p className="text-[10px] text-[#78716c] mt-1">
              {SERVICE_DURATION_MIN}–{SERVICE_DURATION_MAX} мин
            </p>
            {durationError && (
              <p className="text-xs text-red-600 mt-1" data-testid="service-duration-error">
                {durationError}
              </p>
            )}
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#78716c]">Цена (₽)</label>
            <input
              className={`input ${priceError ? "border-red-300 focus:border-red-400 focus:ring-red-200" : ""}`}
              type="text"
              inputMode="numeric"
              data-testid="service-price"
              value={price}
              onChange={(e) => {
                setPrice(digitsInput(e.target.value, 6, SERVICE_PRICE_MAX));
                setPriceError("");
              }}
              placeholder="0"
              aria-invalid={Boolean(priceError)}
            />
            <p className="text-[10px] text-[#78716c] mt-1">
              до {SERVICE_PRICE_MAX.toLocaleString("ru-RU")} ₽
            </p>
            {priceError && (
              <p className="text-xs text-red-600 mt-1" data-testid="service-price-error">
                {priceError}
              </p>
            )}
          </div>
        </div>
        <button type="submit" disabled={adding} className="btn-primary w-full">
          {adding ? "Добавляем..." : "Добавить"}
        </button>
      </form>
    </div>
  );
}
