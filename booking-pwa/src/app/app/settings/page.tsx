"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearToken } from "@/lib/client";
import type { Master } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [maxUserId, setMaxUserId] = useState("");
  const [vkUserId, setVkUserId] = useState("");

  useEffect(() => {
    apiFetch("/api/masters/me")
      .then((m: Master) => {
        setMaster(m);
        setName(m.name);
        setPhone(m.phone);
        setSpecialty(m.specialty);
        setAddress(m.address);
        setDescription(m.description);
        setMaxUserId(m.max_user_id);
        setVkUserId(m.vk_user_id);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await apiFetch("/api/masters/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone,
          specialty,
          address,
          description,
          max_user_id: maxUserId,
          vk_user_id: vkUserId,
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    clearToken();
    router.replace("/app/register");
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
      <h1 className="text-xl font-bold">Настройки</h1>

      <div className="card space-y-3">
        <h3 className="font-semibold">Профиль</h3>
        <div>
          <label className="text-xs text-[#6b7280]">Имя</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#6b7280]">Телефон</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#6b7280]">Специализация</label>
          <input className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#6b7280]">Адрес</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#6b7280]">О себе</label>
          <textarea
            className="input min-h-[80px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">🔔 Уведомления</h3>
        <p className="text-sm text-[#6b7280]">
          Куда присылать уведомления о новых записях
        </p>

        <div className="bg-[#faf9f7] rounded-xl p-3 space-y-3">
          <div>
            <label className="text-xs text-[#6b7280] font-medium">MAX</label>
            <p className="text-xs text-[#6b7280] mb-1">
              Ваш ID в MAX (числовой). Найдите в настройках профиля.
            </p>
            <input
              className="input"
              value={maxUserId}
              onChange={(e) => setMaxUserId(e.target.value)}
              placeholder="12345678"
            />
          </div>

          <div>
            <label className="text-xs text-[#6b7280] font-medium">VK Мессенджер</label>
            <p className="text-xs text-[#6b7280] mb-1">
              Ваш ID ВКонтакте. Напишите нашему боту /start чтобы узнать ID.
            </p>
            <input
              className="input"
              value={vkUserId}
              onChange={(e) => setVkUserId(e.target.value)}
              placeholder="123456789"
            />
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-primary w-full">
        {saving ? "Сохраняем..." : saved ? "✓ Сохранено" : "Сохранить"}
      </button>

      <button onClick={logout} className="btn-outline w-full text-red-500 border-red-200">
        Выйти
      </button>
    </div>
  );
}
