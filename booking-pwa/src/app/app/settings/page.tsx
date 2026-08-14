"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, logoutSession, compressImage } from "@/lib/client";
import LocationPicker from "@/components/LocationPicker";
import PhoneRuInput from "@/components/PhoneRuInput";
import { isValidEmail, isValidPhone } from "@/lib/validate";
// Messengers temporarily hidden in UI (code kept):
// import MaxConnect from "@/components/MaxConnect";
// import TelegramConnect from "@/components/TelegramConnect";
// import VkConnect from "@/components/VkConnect";
import type { Master, NotifyChannel } from "@/lib/types";
import { NOTIFY_UI_ENABLED } from "@/lib/notify-channel";

const CHANNEL_LABELS: Record<
  NotifyChannel,
  { label: string; hint: string }
> = {
  email: { label: "Почта", hint: "Mail.ru и другие ящики" },
  telegram: { label: "Telegram", hint: "Скоро" },
  vk: { label: "VK", hint: "Скоро" },
  max: { label: "MAX", hint: "Скоро" },
};

const CHANNEL_OPTIONS = NOTIFY_UI_ENABLED.map((id) => ({
  id,
  ...CHANNEL_LABELS[id],
}));

export default function SettingsPage() {
  const router = useRouter();
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
  const [notifyEmail, setNotifyEmail] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch("/api/masters/me")
      .then((m: Master) => {
        setName(m.name);
        setPhone(m.phone);
        setSpecialty(m.specialty);
        setSlug(m.slug);
        setAddress(m.address || "");
        setLat(m.lat ?? null);
        setLng(m.lng ?? null);
        setDescription(m.description);
        setAvatarUrl(m.avatar_url || "");
        setNotifyEmail(m.notify_email || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const channelReady = Boolean(notifyEmail.trim());

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    if (!isValidPhone(phone)) {
      setError("Телефон: +7 и 10 цифр");
      setSaving(false);
      return;
    }
    if (notifyEmail.trim() && !isValidEmail(notifyEmail)) {
      setError("Укажите корректный email");
      setSaving(false);
      return;
    }
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
          // Force email while messengers are hidden in UI
          notify_channel: "email",
          notify_email: notifyEmail,
        }),
      });
      setSlug(updated.slug);
      setNotifyEmail(updated.notify_email || "");
      setAvatarUrl(updated.avatar_url || avatarUrl);
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
    setError("");
    try {
      const dataUrl = await compressImage(file, 600);
      setAvatarUrl(dataUrl);
      const updated = await apiFetch("/api/masters/me", {
        method: "PATCH",
        body: JSON.stringify({ avatar_url: dataUrl }),
      });
      setAvatarUrl(updated.avatar_url || "");
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  async function logout() {
    await logoutSession();
    router.replace("/app/login");
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
      <h1 className="text-xl font-bold">Настройки</h1>

      <div className="card space-y-3">
        <h3 className="font-semibold">Профиль</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-[#c4a574]/30 flex items-center justify-center text-2xl shrink-0">
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
              data-testid="settings-avatar-input"
            />
          </label>
        </div>
        <div>
          <label className="text-xs text-[#78716c]">Имя</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-[#78716c]">Телефон</label>
          <PhoneRuInput value={phone} onChange={setPhone} />
        </div>
        <div>
          <label className="text-xs text-[#78716c]">Специализация</label>
          <input
            className="input"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Барбер, маникюр…"
          />
        </div>
        <div>
          <label className="text-xs text-[#78716c]">Адрес страницы</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-[#78716c]">/m/</span>
            <input
              className="input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              data-testid="settings-slug"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[#78716c]">О себе</label>
          <textarea
            className="input min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <LocationPicker
          address={address}
          lat={lat}
          lng={lng}
          onChange={({ address: a, lat: la, lng: ln }) => {
            setAddress(a);
            setLat(la);
            setLng(ln);
            setSaved(false);
          }}
        />
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold">Уведомления</h3>
        <p className="text-sm text-[#78716c]">
          Сейчас уведомления о записях приходят на email. Мессенджеры подключим
          позже.
        </p>

        {CHANNEL_OPTIONS.length > 1 && (
          <div
            className="grid grid-cols-2 gap-2"
            data-testid="notify-channel"
            role="radiogroup"
            aria-label="Канал уведомлений"
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className="rounded-xl border border-[#c4a574] bg-[#c4a574]/15 px-2 py-3 text-center"
                data-testid={`notify-channel-${opt.id}`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-[10px] text-[#78716c] mt-1 leading-tight">
                  {opt.hint}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="bg-[#f4f0ea] rounded-xl p-4 space-y-2 border border-[#c4a574]/40"
          data-testid="notify-email-block"
        >
          <label className="text-sm font-medium text-[#1c1917]">
            Email для уведомлений
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
            autoComplete="email"
          />
          <p className="text-xs text-[#78716c]">
            Сюда придут письма о новых записях, отменах и напоминаниях.
          </p>
          {!channelReady && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              Укажите email и нажмите «Сохранить».
            </p>
          )}
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

      <Link
        href="/app/design"
        className="btn-outline w-full text-center block"
        data-testid="settings-design-link"
      >
        Дизайн страницы
      </Link>

      <Link
        href="/app/billing"
        className="btn-outline w-full text-center block"
        data-testid="settings-billing-link"
      >
        Подписка и оплата
      </Link>

      <button
        onClick={logout}
        className="btn-outline w-full text-red-500 border-red-200"
      >
        Выйти
      </button>
    </div>
  );
}
