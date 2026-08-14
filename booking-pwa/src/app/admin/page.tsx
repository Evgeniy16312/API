"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PasswordInput from "@/components/PasswordInput";
import type { NotifyChannel } from "@/lib/types";
import {
  NOTIFY_CHANNEL_LABELS,
  planLabel,
  planOptionLabel,
  SUBSCRIPTION_STATUS_LABELS,
  subscriptionStatusLabel,
} from "@/lib/admin-labels";

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
const PLANS = ["trial", "lite", "basic", "pro"];
const STATUSES = ["trial", "active", "past_due", "blocked"];
const KEY_STORAGE = "moyazapis_admin_key";

type SortKey = "created_at" | "name" | "bookings" | "paid_until" | "status";

export default function AdminPage() {
  const [key, setKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [masters, setMasters] = useState<AdminMaster[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [blockedFilter, setBlockedFilter] = useState<"all" | "yes" | "no">(
    "all"
  );
  const [sort, setSort] = useState<SortKey>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [purgeConfirm, setPurgeConfirm] = useState("");
  const [showPurge, setShowPurge] = useState(false);

  const load = useCallback(
    async (adminKey: string) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          q,
          status: statusFilter,
          plan: planFilter,
          blocked: blockedFilter,
          sort,
          order,
        });
        const res = await fetch(`/api/admin/masters?${params}`, {
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
    },
    [q, statusFilter, planFilter, blockedFilter, sort, order]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem(KEY_STORAGE);
    if (saved) {
      setKey(saved);
      void load(saved);
    }
    // initial only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!authed || !key) return;
    void load(key);
  }, [authed, key, load]);

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

  async function deleteMaster(m: AdminMaster) {
    if (
      !confirm(
        `Удалить мастера «${m.name}» (/${m.slug}) со всеми записями и услугами?`
      )
    ) {
      return;
    }
    setSavingId(m.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/masters/${m.id}`, {
        method: "DELETE",
        headers: { "x-admin-key": key },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка удаления");
      }
      setMasters((prev) => prev.filter((row) => row.id !== m.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSavingId(null);
    }
  }

  async function purgeAll() {
    setSavingId("purge");
    setError("");
    try {
      const res = await fetch("/api/admin/masters", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": key,
        },
        body: JSON.stringify({ confirm: purgeConfirm }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка очистки");
      }
      const data = await res.json();
      setMasters([]);
      setShowPurge(false);
      setPurgeConfirm("");
      alert(`Удалено мастеров: ${data.deleted}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSavingId(null);
    }
  }

  const totalLabel = useMemo(
    () => `${masters.length} ${masters.length === 1 ? "мастер" : "мастеров"}`,
    [masters.length]
  );

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#f5f3ef] px-4 py-16">
        <div className="max-w-md mx-auto card space-y-4">
          <h1 className="text-xl font-bold">Админ МояЗапись</h1>
          <p className="text-sm text-[#6b7280]">
            Вход по ключу `ADMIN_SETUP_KEY`
          </p>
          <PasswordInput
            data-testid="admin-key"
            value={key}
            onChange={setKey}
            placeholder="Admin key"
            autoComplete="off"
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Мастера</h1>
            <p className="text-sm text-[#6b7280]">
              {totalLabel} · канал, тариф, удаление
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-outline text-sm text-red-600 border-red-200"
              data-testid="admin-purge-open"
              onClick={() => setShowPurge((v) => !v)}
            >
              Очистить всех
            </button>
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
        </div>

        {showPurge && (
          <div
            className="card space-y-3 border border-red-200 bg-red-50/50"
            data-testid="admin-purge-block"
          >
            <p className="text-sm text-red-800">
              Удалит <strong>всех</strong> мастеров и связанные записи/услуги.
              Это необратимо (на проде тоже). Введите{" "}
              <code className="bg-white px-1 rounded">DELETE_ALL</code>:
            </p>
            <input
              className="input"
              data-testid="admin-purge-confirm"
              value={purgeConfirm}
              onChange={(e) => setPurgeConfirm(e.target.value)}
              placeholder="DELETE_ALL"
            />
            <button
              type="button"
              className="btn-primary w-full bg-red-600 border-red-600"
              data-testid="admin-purge-submit"
              disabled={savingId === "purge" || purgeConfirm !== "DELETE_ALL"}
              onClick={() => void purgeAll()}
            >
              {savingId === "purge" ? "Удаляем…" : "Удалить всех мастеров"}
            </button>
          </div>
        )}

        <div
          className="card grid sm:grid-cols-2 lg:grid-cols-5 gap-3"
          data-testid="admin-filters"
        >
          <label className="text-xs space-y-1 block sm:col-span-2">
            <span className="text-[#6b7280]">Поиск</span>
            <input
              className="input"
              data-testid="admin-filter-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Имя, slug, телефон, email"
            />
          </label>
          <label className="text-xs space-y-1 block">
            <span className="text-[#6b7280]">Статус подписки</span>
            <select
              className="input"
              data-testid="admin-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Все</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SUBSCRIPTION_STATUS_LABELS[s]?.label ?? s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1 block">
            <span className="text-[#6b7280]">Тариф</span>
            <select
              className="input"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <option value="all">Все</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {planOptionLabel(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1 block">
            <span className="text-[#6b7280]">Блок</span>
            <select
              className="input"
              value={blockedFilter}
              onChange={(e) =>
                setBlockedFilter(e.target.value as "all" | "yes" | "no")
              }
            >
              <option value="all">Все</option>
              <option value="no">Активные</option>
              <option value="yes">Заблокированные</option>
            </select>
          </label>
          <label className="text-xs space-y-1 block">
            <span className="text-[#6b7280]">Сортировка</span>
            <select
              className="input"
              data-testid="admin-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="created_at">По дате создания</option>
              <option value="name">По имени</option>
              <option value="bookings">По записям</option>
              <option value="paid_until">По оплате до</option>
              <option value="status">По статусу</option>
            </select>
          </label>
          <label className="text-xs space-y-1 block">
            <span className="text-[#6b7280]">Порядок</span>
            <select
              className="input"
              value={order}
              onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
            >
              <option value="desc">Сначала новые / больше</option>
              <option value="asc">Сначала старые / меньше</option>
            </select>
          </label>
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
                    {" · "}
                    {planLabel(m.plan)} · {subscriptionStatusLabel(m.subscription_status)}
                    {m.blocked ? " · ЗАБЛОКИРОВАН" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="text-sm px-3 py-1 rounded-lg border border-[#c9a96e] text-[#8a6d2f]"
                    disabled={savingId === m.id}
                    data-testid={`admin-extend-${m.slug}`}
                    onClick={() => patchMaster(m.id, { extend_days: 30 })}
                  >
                    +30 дней
                  </button>
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
                  <button
                    type="button"
                    className="text-sm px-3 py-1 rounded-lg border border-red-300 text-red-700"
                    disabled={savingId === m.id}
                    data-testid={`admin-delete-${m.slug}`}
                    onClick={() => void deleteMaster(m)}
                  >
                    Удалить
                  </button>
                </div>
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
                        {NOTIFY_CHANNEL_LABELS[c] ?? c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs space-y-1 block">
                  <span className="text-[#6b7280]">Тариф</span>
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
                        {planOptionLabel(p)}
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
                        {SUBSCRIPTION_STATUS_LABELS[s]?.label ?? s}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-[#9ca3af] leading-snug block mt-1">
                    {SUBSCRIPTION_STATUS_LABELS[m.subscription_status]?.hint}
                  </span>
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
            <p className="text-sm text-[#6b7280]">
              {loading ? "Загрузка…" : "Никого не найдено"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
