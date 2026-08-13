"use client";

import { useCallback, useEffect, useState } from "react";
import type { NotifyChannel } from "@/lib/types";

type AdminMaster = {
  id: string;
  slug: string;
  name: string;
  phone: string;
  notify_channel: NotifyChannel;
  notify_email: string;
  max_user_id: string;
  vk_user_id: string;
  telegram_user_id: string;
  plan: string;
  subscription_status: string;
  paid_until: string;
  blocked: boolean;
  bookings_count: number;
  created_at: string;
};

const CHANNELS: NotifyChannel[] = ["max", "vk", "telegram", "email"];
const PLANS = ["trial", "basic", "pro"];
const STATUSES = ["trial", "active", "past_due", "blocked"];
const KEY_STORAGE = "moyazapis_admin_key";

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [masters, setMasters] = useState<AdminMaster[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async (adminKey: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/masters", {
        headers: { "x-admin-key": adminKey },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Нет доступа");
      }
      const data = await res.json();
      setMasters(data.masters || []);
      setAuthed(true);
      sessionStorage.setItem(KEY_STORAGE, adminKey);
    } catch (e) {
      setAuthed(false);
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY_STORAGE);
    if (saved) {
      setKey(saved);
      void load(saved);
    }
  }, [load]);

  async function patchMaster(id: string, body: Record<string, unknown>) {
    setSavingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/masters/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка сохранения");
      }
      const updated = (await res.json()) as AdminMaster;
      setMasters((prev) => prev.map((m) => (m.id === id ? updated : m)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSavingId(null);
    }
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] px-4 py-16">
        <div className="max-w-md mx-auto card space-y-4">
          <h1 className="text-xl font-bold">Админ МояЗапись</h1>
          <p className="text-sm text-[#6b7280]">
            Вход по ключу `ADMIN_SETUP_KEY`
          </p>
          <input
            className="input"
            type="password"
            data-testid="admin-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
          />
          {error && (
            <p className="text-sm text-red-600" data-testid="admin-error">
              {error}
            </p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            data-testid="admin-login"
            disabled={loading || !key}
            onClick={() => load(key)}
          >
            {loading ? "Проверяем..." : "Войти"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f3ef] px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Мастера</h1>
            <p className="text-sm text-[#6b7280]">
              Канал уведомлений, тариф, блокировка
            </p>
          </div>
          <button
            type="button"
            className="btn-outline text-sm"
            onClick={() => {
              sessionStorage.removeItem(KEY_STORAGE);
              setAuthed(false);
              setMasters([]);
            }}
          >
            Выйти
          </button>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="space-y-3" data-testid="admin-masters">
          {masters.map((m) => (
            <div
              key={m.id}
              className="card space-y-3"
              data-testid={`admin-master-${m.slug}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">
                    {m.name}{" "}
                    <span className="text-[#6b7280] font-normal">
                      /{m.slug}
                    </span>
                  </div>
                  <div className="text-xs text-[#6b7280]">
                    {m.phone} · записей: {m.bookings_count}
                    {m.blocked ? " · ЗАБЛОКИРОВАН" : ""}
                  </div>
                </div>
                <button
                  type="button"
                  className={`text-sm px-3 py-1 rounded-lg border ${
                    m.blocked
                      ? "border-green-300 text-green-700"
                      : "border-red-200 text-red-600"
                  }`}
                  disabled={savingId === m.id}
                  onClick={() => patchMaster(m.id, { blocked: !m.blocked })}
                >
                  {m.blocked ? "Разблокировать" : "Заблокировать"}
                </button>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <label className="text-xs space-y-1 block">
                  <span className="text-[#6b7280]">Канал уведомлений</span>
                  <select
                    className="input"
                    data-testid={`admin-channel-${m.slug}`}
                    value={m.notify_channel}
                    disabled={savingId === m.id}
                    onChange={(e) =>
                      patchMaster(m.id, {
                        notify_channel: e.target.value as NotifyChannel,
                      })
                    }
                  >
                    {CHANNELS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs space-y-1 block">
                  <span className="text-[#6b7280]">План</span>
                  <select
                    className="input"
                    value={m.plan}
                    disabled={savingId === m.id}
                    onChange={(e) =>
                      patchMaster(m.id, { plan: e.target.value })
                    }
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs space-y-1 block">
                  <span className="text-[#6b7280]">Статус подписки</span>
                  <select
                    className="input"
                    value={m.subscription_status}
                    disabled={savingId === m.id}
                    onChange={(e) =>
                      patchMaster(m.id, {
                        subscription_status: e.target.value,
                      })
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs space-y-1 block">
                  <span className="text-[#6b7280]">Оплачено до</span>
                  <input
                    className="input"
                    type="date"
                    value={m.paid_until ? m.paid_until.slice(0, 10) : ""}
                    disabled={savingId === m.id}
                    onChange={(e) =>
                      patchMaster(m.id, {
                        paid_until: e.target.value
                          ? `${e.target.value}T23:59:59.000Z`
                          : "",
                        subscription_status: e.target.value
                          ? "active"
                          : m.subscription_status,
                      })
                    }
                  />
                </label>
                <label className="text-xs space-y-1 block">
                  <span className="text-[#6b7280]">Email для уведомлений</span>
                  <input
                    className="input"
                    type="email"
                    value={m.notify_email || ""}
                    disabled={savingId === m.id}
                    onBlur={(e) => {
                      if (e.target.value !== (m.notify_email || "")) {
                        void patchMaster(m.id, {
                          notify_email: e.target.value,
                        });
                      }
                    }}
                    onChange={(e) =>
                      setMasters((prev) =>
                        prev.map((row) =>
                          row.id === m.id
                            ? { ...row, notify_email: e.target.value }
                            : row
                        )
                      )
                    }
                  />
                </label>
              </div>

              <p className="text-[11px] text-[#9ca3af]">
                connect: MAX {m.max_user_id || "—"} · VK {m.vk_user_id || "—"} ·
                TG {m.telegram_user_id || "—"}
              </p>
            </div>
          ))}
          {masters.length === 0 && (
            <p className="text-sm text-[#6b7280]">Мастеров пока нет</p>
          )}
        </div>
      </div>
    </div>
  );
}
