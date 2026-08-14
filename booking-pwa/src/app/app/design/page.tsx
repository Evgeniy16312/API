"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import {
  CLASSIC_PAGE_THEME,
  PAGE_THEME_PRESETS,
  pageThemeCssVars,
  pageThemeFontHref,
} from "@/lib/page-theme";
import type { Master, PageFontId, PageTheme } from "@/lib/types";

const FONT_OPTIONS: { id: PageFontId; label: string }[] = [
  { id: "inter", label: "Inter — спокойный" },
  { id: "cormorant", label: "Cormorant — салон" },
  { id: "nunito", label: "Nunito — мягкий" },
  { id: "manrope", label: "Manrope — современный" },
];

const COLOR_FIELDS: { key: keyof PageTheme; label: string }[] = [
  { key: "background", label: "Фон" },
  { key: "header", label: "Шапка" },
  { key: "ink", label: "Текст" },
  { key: "accent", label: "Акцент" },
  { key: "card", label: "Карточки" },
];

export default function DesignPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [master, setMaster] = useState<Master | null>(null);
  const [theme, setTheme] = useState<PageTheme>({ ...CLASSIC_PAGE_THEME });

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
    <div className="px-4 py-5 space-y-4" data-testid="design-page">
      {fontHref ? (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontHref} />
      ) : null}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Дизайн страницы</h1>
        <p className="text-sm text-[#78716c] mt-1">
          Так клиент видит вашу ссылку записи. На Старте и Мастере — классика.
        </p>
      </div>

      {locked && (
        <div className="card space-y-3" data-testid="design-locked">
          <p className="font-semibold">Свой дизайн — в тарифе Витрина</p>
          <p className="text-sm text-[#78716c]">
            Цвета, шрифт и шапка вашей витрины. Классический вид на Basic
            остаётся аккуратным и узнаваемым.
          </p>
          <Link href="/app/billing" className="btn-primary block text-center">
            Перейти на Витрину · 590 ₽
          </Link>
        </div>
      )}

      <div
        className="page-theme rounded-2xl overflow-hidden border border-[#e7e0d6]"
        style={pageThemeCssVars(theme)}
        data-testid="design-preview"
      >
        <div className="mz-hero px-4 py-5">
          <p className="text-lg font-bold">{master?.name || "Ваше имя"}</p>
          <p className="mz-accent text-sm">{master?.specialty || "Специализация"}</p>
        </div>
        <div className="p-4">
          <div className="card text-sm">Запись · превью для клиента</div>
        </div>
      </div>

      {!locked && (
        <>
          <div>
            <p className="text-sm font-semibold mb-2">Готовые стили</p>
            <div className="grid grid-cols-2 gap-2">
              {PAGE_THEME_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  data-testid={`design-preset-${p.id}`}
                  onClick={() => setTheme({ ...p.theme })}
                  className="btn-outline text-sm"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            {COLOR_FIELDS.map((f) => (
              <label
                key={f.key}
                className="flex items-center justify-between gap-3 min-h-12"
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
            <label className="block space-y-1">
              <span className="text-sm">Шрифт</span>
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
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

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
