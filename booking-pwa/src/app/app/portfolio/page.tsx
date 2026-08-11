"use client";

import { useEffect, useState, useRef } from "react";
import { apiFetch, compressImage } from "@/lib/client";
import type { PortfolioItem } from "@/lib/types";

export default function PortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPortfolio();
  }, []);

  async function loadPortfolio() {
    try {
      const data = await apiFetch("/api/portfolio");
      setItems(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const image_url = await compressImage(file);
      await apiFetch("/api/portfolio", {
        method: "POST",
        body: JSON.stringify({ image_url }),
      });
      await loadPortfolio();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function deleteItem(id: string) {
    if (!confirm("Удалить фото?")) return;
    await apiFetch(`/api/portfolio/${id}`, { method: "DELETE" });
    await loadPortfolio();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4">
      <h1 className="text-xl font-bold">Портфолио</h1>
      <p className="text-sm text-[#6b7280]">
        Фото ваших работ — клиенты увидят на странице
      </p>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden group">
              <img
                src={item.image_url}
                alt="Работа"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => deleteItem(item.id)}
                className="absolute top-2 right-2 bg-red-500 text-white w-7 h-7 rounded-full text-sm opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="btn-outline w-full"
      >
        {uploading ? "Загружаем..." : "📷 Добавить фото"}
      </button>
    </div>
  );
}
