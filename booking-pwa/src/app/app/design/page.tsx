"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PageThemePreview from "@/components/PageThemePreview";
import { apiFetch, compressImage } from "@/lib/client";
import {
  CLASSIC_PAGE_THEME,
  PAGE_BACKGROUND_PRESETS,
  PAGE_THEME_PRESETS,
  pageThemeFontHref,
} from "@/lib/page-theme";
import type {
  Master,
  PageBackgroundPreset,
  PageCardStyle,
  PageFontId,
  PageFontSize,
  PageHeroStyle,
  PageTheme,
} from "@/lib/types";

const FONT_OPTIONS: { id: PageFontId; label: string }[] = [
  { id: "inter", label: "Inter — нейтральный" },
  { id: "cormorant", label: "Cormorant — салон" },
  { id: "nunito", label: "Nunito — мягкий" },
  { id: "manrope", label: "Manrope — современный" },
  { id: "playfair", label: "Playfair — премиум" },
  { id: "rubik", label: "Rubik — дружелюбный" },
  { id: "montserrat", label: "Montserrat — чёткий" },
];

const SIZE_OPTIONS: { id: PageFontSize; label: string }[] = [
  { id: "sm", label: "S" },
  { id: "md", label: "M" },
  { id: "lg", label: "L" },
  { id: "xl", label: "XL" },
];

const COLOR_FIELDS: { key: keyof PageTheme; label: string }[] = [
  { key: "background", label: "Фон (если без картинки)" },
  { key: "header", label: "Шапка" },
  { key: "headerText", label: "Имя на шапке" },
  { key: "specialtyText", label: "Специализация" },
  { key: "ink", label: "Основной текст" },
  { key: "accent", label: "Акцент / кнопки" },
  { key: "card", label: "Карточки" },
];

const HERO_STYLES: { id: PageHeroStyle; label: string }[] = [
  { id: "solid", label: "Сплошная" },
  { id: "gradient", label: "Градиент" },
  { id: "glass", label: "Стекло" },
];

const CARD_STYLES: { id: PageCardStyle; label: string }[] = [
  { id: "soft", label: "Мягкие" },
  { id: "round", label: "Круглые" },
  { id: "sharp", label: "Строгие" },
];

export default function DesignPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [master, setMaster] = useState<Master | null>(null);
  const [theme, setTheme] = useState<PageTheme>({ ...CLASSIC_PAGE_THEME });
  const bgFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/masters/me")
      .then((m: Master) => {
        setMaster(m);
        setTheme(m.page_theme || { ...CLASSIC_PAGE_THEME });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const updated = await apiFetch("/api/masters/me", {
        method: "PATCH",
        body: JSON.stringify({ page_theme: theme }),
      });
      setTheme(updated.page_theme);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  function pickPreset(id: string) {
    const preset = PAGE_THEME_PRESETS.find((p) => p.id === id);
    if (preset) setTheme({ ...preset.theme });
  }

  function pickBgPreset(id: PageBackgroundPreset) {
    setTheme({
      ...theme,
      backgroundKind: "preset",
      backgroundPreset: id,
      backgroundImage: "",
    });
  }

  function clearBackgroundImage() {
    setTheme({
      ...theme,
      backgroundKind: "color",
      backgroundPreset: null,
      backgroundImage: "",
    });
  }

  async function onBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImage(file, 1600);
      setTheme({
        ...theme,
        backgroundKind: "custom",
        backgroundPreset: null,
        backgroundImage: dataUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить фон");
    } finally {
      if (bgFileRef.current) bgFileRef.current.value = "";
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c4a574] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const locked = !master?.theme_customizable;
  const fontHref = pageThemeFontHref(theme.font);

  return (
    <div className="px-4 py-5 space-y-5" data-testid="design-page">
      {fontHref ? (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontHref} />
      ) : null}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Дизайн страницы</h1>
        <p className="text-sm text-[#78716c] mt-1">
          Премиум-витрина для клиентов по вашей ссылке. На «Старт» и «Стандарт»
          — классический вид.
        </p>
      </div>

      {locked && (
        <div className="card space-y-3" data-testid="design-locked">
          <p className="font-semibold">Свой дизайн — в тарифе «Премиум»</p>
          <p className="text-sm text-[#78716c]">
            12 готовых стилей, фоны, шрифты, размеры и уникальные эффекты для
            страницы записи.
          </p>
          <Link href="/app/billing" className="btn-primary w-full">
            Перейти на «Премиум» · от 499 ₽ / мес
          </Link>
        </div>
      )}

      <PageThemePreview
        theme={theme}
        name={master?.name || ""}
        specialty={master?.specialty || ""}
        avatarUrl={master?.avatar_url}
      />

      {!locked && (
        <>
          <section className="space-y-2">
            <p className="text-sm font-semibold">Готовые стили</p>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_THEME_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`design-preset-${p.id}`}
                  onClick={() => pickPreset(p.id)}
                  className="btn-outline text-sm text-left px-3 py-2.5"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          <section className="card space-y-3">
            <p className="font-semibold text-sm">Фон страницы</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`text-sm px-3 py-1.5 rounded-full border ${
                  theme.backgroundKind === "color"
                    ? "border-[#c4a574] bg-[#c4a574]/10"
                    : "border-[#e7e0d6]"
                }`}
                onClick={clearBackgroundImage}
              >
                Только цвет
              </button>
            </div>
            <p className="text-xs text-[#78716c]">Галерея</p>
            <div className="grid grid-cols-3 gap-2">
              {PAGE_BACKGROUND_PRESETS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  data-testid={`design-bg-${bg.id}`}
                  onClick={() => pickBgPreset(bg.id)}
                  className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 ${
                    theme.backgroundKind === "preset" &&
                    theme.backgroundPreset === bg.id
                      ? "border-[#c4a574]"
                      : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={bg.path}
                    alt={bg.label}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 inset-x-0 bg-black/45 text-white text-[10px] py-0.5 text-center">
                    {bg.label}
                  </span>
                </button>
              ))}
            </div>
            <div>
              <input
                ref={bgFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onBgUpload}
              />
              <button
                type="button"
                data-testid="design-bg-upload"
                className="btn-outline w-full text-sm"
                onClick={() => bgFileRef.current?.click()}
              >
                {theme.backgroundKind === "custom"
                  ? "Заменить своё фото"
                  : "Загрузить своё фото"}
              </button>
            </div>
            {(theme.backgroundKind === "preset" ||
              theme.backgroundKind === "custom") && (
              <label className="block space-y-1">
                <span className="text-xs text-[#78716c]">
                  Затемнение фото ({theme.backgroundOverlay}%)
                </span>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={theme.backgroundOverlay}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      backgroundOverlay: Number(e.target.value),
                    })
                  }
                  className="w-full"
                  data-testid="design-bg-overlay"
                />
              </label>
            )}
          </section>

          <section className="card space-y-3">
            <p className="font-semibold text-sm">Шрифты и размеры</p>
            <label className="block space-y-1">
              <span className="text-xs text-[#78716c]">Шрифт</span>
              <select
                data-testid="design-font"
                className="input"
                value={theme.font}
                onChange={(e) =>
                  setTheme({ ...theme, font: e.target.value as PageFontId })
                }
              >
                {FONT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-[#78716c]">Имя на шапке</span>
                <select
                  className="input"
                  value={theme.fontSizeTitle}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      fontSizeTitle: e.target.value as PageFontSize,
                    })
                  }
                >
                  {SIZE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-[#78716c]">Текст на странице</span>
                <select
                  className="input"
                  value={theme.fontSizeBody}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      fontSizeBody: e.target.value as PageFontSize,
                    })
                  }
                >
                  {SIZE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="card space-y-3">
            <p className="font-semibold text-sm">Цвета</p>
            {COLOR_FIELDS.map((f) => (
              <label
                key={f.key}
                className="flex items-center justify-between gap-3 min-h-11"
              >
                <span className="text-sm">{f.label}</span>
                <input
                  type="color"
                  value={String(theme[f.key])}
                  onChange={(e) =>
                    setTheme({ ...theme, [f.key]: e.target.value })
                  }
                  className="h-10 w-14 rounded-lg border border-[#e7e0d6] bg-transparent p-0.5"
                  aria-label={f.label}
                />
              </label>
            ))}
          </section>

          <section className="card space-y-3">
            <p className="font-semibold text-sm">Премиум-эффекты</p>
            <div className="grid grid-cols-3 gap-2">
              {HERO_STYLES.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  data-testid={`design-hero-${h.id}`}
                  onClick={() => setTheme({ ...theme, heroStyle: h.id })}
                  className={`text-sm py-2 rounded-xl border ${
                    theme.heroStyle === h.id
                      ? "border-[#c4a574] bg-[#c4a574]/10"
                      : "border-[#e7e0d6]"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CARD_STYLES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTheme({ ...theme, cardStyle: c.id })}
                  className={`text-sm py-2 rounded-xl border ${
                    theme.cardStyle === c.id
                      ? "border-[#c4a574] bg-[#c4a574]/10"
                      : "border-[#e7e0d6]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <label className="flex items-center justify-between gap-3 min-h-11">
              <span className="text-sm">Бейдж «Запись онлайн»</span>
              <input
                type="checkbox"
                checked={theme.showWelcomeBadge}
                onChange={(e) =>
                  setTheme({ ...theme, showWelcomeBadge: e.target.checked })
                }
                data-testid="design-badge"
              />
            </label>
            <label className="flex items-center justify-between gap-3 min-h-11">
              <span className="text-sm">Свечение кнопок</span>
              <input
                type="checkbox"
                checked={theme.accentGlow}
                onChange={(e) =>
                  setTheme({ ...theme, accentGlow: e.target.checked })
                }
                data-testid="design-glow"
              />
            </label>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            data-testid="design-save"
            onClick={save}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? "Сохраняем..." : saved ? "Сохранено" : "Сохранить дизайн"}
          </button>
        </>
      )}
    </div>
  );
}
