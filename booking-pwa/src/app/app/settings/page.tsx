"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, logoutSession, compressImage } from "@/lib/client";
import MaxConnect from "@/components/MaxConnect";
import LocationPicker from "@/components/LocationPicker";
import TelegramConnect from "@/components/TelegramConnect";
import VkConnect from "@/components/VkConnect";
import type { Master, NotifyChannel } from "@/lib/types";

const CHANNEL_OPTIONS: { id: NotifyChannel; label: string; hint: string }[] = [
  { id: "max", label: "MAX", hint: "Мессенджер MAX" },
  { id: "vk", label: "VK", hint: "ВКонтакте" },
  { id: "telegram", label: "Telegram", hint: "Через VPN тоже ок" },
  { id: "email", label: "Почта", hint: "Mail.ru и др." },
];

export default function SettingsPage() {
  const router = useRouter();
  const [master, setMaster] = useState<Master | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [vkUserId, setVkUserId] = useState("");
  const [notifyChannel, setNotifyChannel] = useState<NotifyChannel>("max");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

  const [recoveryToken, setRecoveryToken] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setRecoveryToken(getToken() || "");
    apiFetch("/api/masters/me")
      .then((m: Master) => {
        setMaster(m);
        setName(m.name);
        setPhone(m.phone);
        setSpecialty(m.specialty);
        setSlug(m.slug);
        setAddress(m.address || "");
        setLat(m.lat ?? null);
        setLng(m.lng ?? null);
        setDescription(m.description);
        setAvatarUrl(m.avatar_url || "");
        setVkUserId(m.vk_user_id);
        setNotifyChannel(m.notify_channel || "max");
        setNotifyEmail(m.notify_email || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const channelReady =
    (notifyChannel === "max" && Boolean(master?.max_user_id)) ||
    (notifyChannel === "vk" && Boolean(vkUserId.trim())) ||
    (notifyChannel === "telegram" && Boolean(master?.telegram_user_id)) ||
    (notifyChannel === "email" && Boolean(notifyEmail.trim()));

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const updated = await apiFetch("/api/masters/me", {
        method: "PATCH",
        body: JSON.stringify({
          name,
          phone,
          specialty,
          slug,
          address,
          lat,
          lng,
          description,
          avatar_url: avatarUrl,
          vk_user_id: vkUserId,
          notify_channel: notifyChannel,
          notify_email: notifyEmail,
        }),
      });
      setMaster(updated);
      setSlug(updated.slug);
      setNotifyChannel(updated.notify_channel || "max");
      setNotifyEmail(updated.notify_email || "");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const dataUrl = await compressImage(file, 600);
      setAvatarUrl(dataUrl);
      setSaved(false);
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function logout() {
    await logoutSession();
    router.replace("/app/login");
  }

  async function copyRecovery() {
    if (!recoveryToken) return;
    await navigator.clipboard.writeText(recoveryToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#c9a96e]/30 flex items-center justify-center text-2xl shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              name.charAt(0) || "?"
            )}
          </div>
          <label className="btn-outline text-sm py-2 cursor-pointer">
            {uploadingAvatar ? "Загрузка..." : "Сменить фото"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
              disabled={uploadingAvatar}
            />
          </label>
        </div>
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
          <input
            className="input"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-[#6b7280]">Адрес страницы (ссылка)</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-[#6b7280] shrink-0">/m/</span>
            <input
              className="input"
              data-testid="settings-slug"
              value={slug}
              onChange={(e) =>
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
              }
              placeholder="anna-manikur"
            />
          </div>
          <p className="text-xs text-[#6b7280] mt-1">
            Клиенты открывают эту ссылку и QR. После смены старая ссылка
            перестанет работать.
          </p>
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
        <h3 className="font-semibold">Где принимаете</h3>
        <LocationPicker
          address={address}
          lat={lat}
          lng={lng}
          onChange={(next) => {
            setAddress(next.address);
            setLat(next.lat);
            setLng(next.lng);
            setSaved(false);
          }}
        />
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Код доступа</h3>
        <p className="text-sm text-[#6b7280]">
          Сохраните код — им можно войти с другого устройства или после очистки
          браузера. Не передавайте посторонним.
        </p>
        <code
          data-testid="recovery-token"
          className="block text-xs break-all bg-[#faf9f7] p-3 rounded-xl border border-[#e8e6e3]"
        >
          {recoveryToken || "—"}
        </code>
        <button
          type="button"
          onClick={copyRecovery}
          className="btn-outline w-full"
          data-testid="copy-recovery"
        >
          {copied ? "Скопировано" : "Скопировать код"}
        </button>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Уведомления</h3>
        <p className="text-sm text-[#6b7280]">
          Выберите один канал — туда будут приходить новые записи и напоминания
        </p>

        <div
          className="grid grid-cols-2 gap-2"
          data-testid="notify-channel"
          role="radiogroup"
          aria-label="Канал уведомлений"
        >
          {CHANNEL_OPTIONS.map((opt) => {
            const active = notifyChannel === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`notify-channel-${opt.id}`}
                onClick={() => {
                  setNotifyChannel(opt.id);
                  setSaved(false);
                }}
                className={`rounded-xl border px-2 py-3 text-center transition-colors ${
                  active
                    ? "border-[#c9a96e] bg-[#c9a96e]/15"
                    : "border-[#e8e6e3] bg-[#faf9f7]"
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-[10px] text-[#6b7280] mt-1 leading-tight">
                  {opt.hint}
                </div>
              </button>
            );
          })}
        </div>

        {!channelReady && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
            Канал выбран, но ещё не подключён — уведомления не уйдут, пока не
            завершите настройку ниже.
          </p>
        )}

        <div className="bg-[#faf9f7] rounded-xl p-3 space-y-3">
          <div className={notifyChannel === "max" ? "" : "opacity-60"}>
            <label className="text-xs text-[#6b7280] font-medium">MAX</label>
            <p className="text-xs text-[#6b7280] mb-2">
              Подключите бота — затем выберите канал MAX выше
            </p>
            <MaxConnect />
          </div>

          <div
            className={`border-t border-[#e8e6e3] pt-3 space-y-2 ${
              notifyChannel === "vk" ? "" : "opacity-60"
            }`}
          >
            <label className="text-xs text-[#6b7280] font-medium">VK</label>
            <VkConnect />
            <p className="text-xs text-[#6b7280]">
              Или укажите ID вручную (если Callback ещё не настроен):
            </p>
            <input
              className="input"
              value={vkUserId}
              onChange={(e) => setVkUserId(e.target.value)}
              placeholder="123456789"
            />
          </div>

          <div
            className={`border-t border-[#e8e6e3] pt-3 space-y-2 ${
              notifyChannel === "telegram" ? "" : "opacity-60"
            }`}
          >
            <label className="text-xs text-[#6b7280] font-medium">
              Telegram
            </label>
            <p className="text-xs text-[#6b7280] mb-2">
              Подключите бота — затем выберите канал Telegram выше
            </p>
            <TelegramConnect />
          </div>

          <div
            className={`border-t border-[#e8e6e3] pt-3 space-y-2 ${
              notifyChannel === "email" ? "" : "opacity-60"
            }`}
          >
            <label className="text-xs text-[#6b7280] font-medium">
              Email (Mail.ru и др.)
            </label>
            <input
              className="input"
              type="email"
              data-testid="notify-email"
              value={notifyEmail}
              onChange={(e) => {
                setNotifyEmail(e.target.value);
                setSaved(false);
              }}
              placeholder="name@mail.ru"
            />
            <p className="text-xs text-[#6b7280]">
              Письма отправит сервер МояЗапись (SMTP). Нужна настройка на стороне
              платформы.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="btn-primary w-full"
        data-testid="settings-save"
      >
        {saving ? "Сохраняем..." : saved ? "✓ Сохранено" : "Сохранить"}
      </button>

      <button
        onClick={logout}
        className="btn-outline w-full text-red-500 border-red-200"
      >
        Выйти
      </button>
    </div>
  );
}
