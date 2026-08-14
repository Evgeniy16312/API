import type { CSSProperties } from "react";
import type { PageFontId, PageTheme } from "@/lib/types";

export const PAGE_FONTS: PageFontId[] = [
  "inter",
  "cormorant",
  "nunito",
  "manrope",
];

export type { PageFontId, PageTheme };

export const CLASSIC_PAGE_THEME: PageTheme = {
  accent: "#c4a574",
  background: "#f4f0ea",
  ink: "#1c1917",
  header: "#1c1917",
  card: "#fffcf8",
  font: "inter",
};

export const PAGE_THEME_PRESETS: { id: string; label: string; theme: PageTheme }[] =
  [
    { id: "classic", label: "Классика", theme: { ...CLASSIC_PAGE_THEME } },
    {
      id: "night",
      label: "Ночь",
      theme: {
        accent: "#d4a574",
        background: "#0c0a09",
        ink: "#fafaf9",
        header: "#1c1917",
        card: "#1c1917",
        font: "manrope",
      },
    },
    {
      id: "rose",
      label: "Салон",
      theme: {
        accent: "#c45c7a",
        background: "#fdf2f4",
        ink: "#4a1c2a",
        header: "#4a1c2a",
        card: "#fff7f8",
        font: "cormorant",
      },
    },
    {
      id: "emerald",
      label: "Изумруд",
      theme: {
        accent: "#3d7a5c",
        background: "#f0f5f1",
        ink: "#14532d",
        header: "#14532d",
        card: "#f7fbf8",
        font: "nunito",
      },
    },
  ];

const HEX = /^#[0-9a-fA-F]{6}$/;

const FONT_STACK: Record<PageFontId, string> = {
  inter: "var(--font-geist-sans), system-ui, sans-serif",
  cormorant: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  nunito: '"Nunito", ui-rounded, system-ui, sans-serif',
  manrope: '"Manrope", system-ui, sans-serif',
};

const FONT_HREF: Record<PageFontId, string | null> = {
  inter: null,
  cormorant:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap",
  nunito:
    "https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700&display=swap",
  manrope:
    "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&display=swap",
};

export function isPageFontId(value: unknown): value is PageFontId {
  return PAGE_FONTS.includes(value as PageFontId);
}

export function parseStoredPageTheme(raw: unknown): PageTheme {
  if (!raw) return { ...CLASSIC_PAGE_THEME };
  let data: unknown = raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return { ...CLASSIC_PAGE_THEME };
    try {
      data = JSON.parse(trimmed);
    } catch {
      return { ...CLASSIC_PAGE_THEME };
    }
  }
  const parsed = sanitizePageTheme(data);
  return parsed.ok ? parsed.theme : { ...CLASSIC_PAGE_THEME };
}

export function sanitizePageTheme(
  input: unknown
): { ok: true; theme: PageTheme } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Некорректная тема" };
  }
  const body = input as Record<string, unknown>;
  const theme: PageTheme = { ...CLASSIC_PAGE_THEME };

  for (const key of ["accent", "background", "ink", "header", "card"] as const) {
    if (body[key] !== undefined) {
      const hex = String(body[key]).trim();
      if (!HEX.test(hex)) {
        return { ok: false, error: "Цвет — только HEX вида #c4a574" };
      }
      theme[key] = hex.toLowerCase();
    }
  }

  if (body.font !== undefined) {
    if (!isPageFontId(body.font)) {
      return { ok: false, error: "Этот шрифт недоступен" };
    }
    theme.font = body.font;
  }

  return { ok: true, theme };
}

export function pageThemeCssVars(theme: PageTheme): CSSProperties {
  return {
    ["--mz-bg" as string]: theme.background,
    ["--mz-ink" as string]: theme.ink,
    ["--mz-accent" as string]: theme.accent,
    ["--mz-header" as string]: theme.header,
    ["--mz-card" as string]: theme.card,
    ["--mz-font" as string]: FONT_STACK[theme.font],
  } as CSSProperties;
}

export function pageThemeFontHref(font: PageFontId): string | null {
  return FONT_HREF[font];
}
