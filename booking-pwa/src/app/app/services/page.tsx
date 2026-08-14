"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client";
import type { Service } from "@/lib/types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("");
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
    setAdding(true);
    try {
      await apiFetch("/api/services", {
        method: "POST",
        body: JSON.stringify({
          name,
          duration: Math.max(15, parseInt(duration, 10) || 60),
          price: parseInt(price, 10) || 0,
        }),
      });
      setName("");
      setDuration("60");
      setPrice("");
      await loadServices();
    } catch {
      // handled by apiFetch
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
              className="input"
              type="text"
              inputMode="numeric"
              data-testid="service-duration"
              value={duration}
              onChange={(e) =>
                setDuration(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="60"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-[#78716c]">Цена (₽)</label>
            <input
              className="input"
              type="text"
              inputMode="numeric"
              data-testid="service-price"
              value={price}
              onChange={(e) =>
                setPrice(e.target.value.replace(/\D/g, "").slice(0, 7))
              }
              placeholder="0"
            />
          </div>
        </div>
        <button type="submit" disabled={adding} className="btn-primary w-full">
          {adding ? "Добавляем..." : "Добавить"}
        </button>
      </form>
    </div>
  );
}
