import type { CSSProperties } from "react";
import type {
  PageBackgroundKind,
  PageBackgroundPreset,
  PageCardStyle,
  PageFontId,
  PageFontSize,
  PageHeroStyle,
  PageTheme,
} from "@/lib/types";

export const PAGE_FONTS: PageFontId[] = [
  "inter",
  "cormorant",
  "nunito",
  "manrope",
  "playfair",
  "rubik",
  "montserrat",
];

export type {
  PageBackgroundKind,
  PageBackgroundPreset,
  PageCardStyle,
  PageFontId,
  PageFontSize,
  PageHeroStyle,
  PageTheme,
};

export const PAGE_BACKGROUND_PRESETS: {
  id: PageBackgroundPreset;
  label: string;
  path: string;
}[] = [
  { id: "flowers", label: "Цветы", path: "/theme-bg/flowers.svg" },
  { id: "abstract", label: "Абстракция", path: "/theme-bg/abstract.svg" },
  { id: "nature", label: "Природа", path: "/theme-bg/nature.svg" },
  { id: "city", label: "Город", path: "/theme-bg/city.svg" },
  { id: "watercolor", label: "Акварель", path: "/theme-bg/watercolor.svg" },
];

const FONT_SIZE_TITLE: Record<PageFontSize, string> = {
  sm: "1.125rem",
  md: "1.375rem",
  lg: "1.625rem",
  xl: "1.875rem",
};

const FONT_SIZE_BODY: Record<PageFontSize, string> = {
  sm: "0.875rem",
  md: "1rem",
  lg: "1.0625rem",
  xl: "1.125rem",
};

export const CLASSIC_PAGE_THEME: PageTheme = {
  accent: "#c4a574",
  background: "#f4f0ea",
  ink: "#1c1917",
  header: "#1c1917",
  card: "#fffcf8",
  font: "inter",
  headerText: "#fffcf8",
  specialtyText: "#c4a574",
  fontSizeTitle: "lg",
  fontSizeBody: "md",
  backgroundKind: "color",
  backgroundPreset: null,
  backgroundImage: "",
  backgroundOverlay: 35,
  heroStyle: "solid",
  cardStyle: "soft",
  showWelcomeBadge: false,
  accentGlow: false,
};

function baseTheme(overrides: Partial<PageTheme>): PageTheme {
  return { ...CLASSIC_PAGE_THEME, ...overrides };
}

export const PAGE_THEME_PRESETS: { id: string; label: string; theme: PageTheme }[] =
  [
    { id: "classic", label: "Классика", theme: baseTheme({}) },
    {
      id: "night",
      label: "Ночь",
      theme: baseTheme({
        accent: "#d4a574",
        background: "#0c0a09",
        ink: "#fafaf9",
        header: "#1c1917",
        card: "#292524",
        headerText: "#fafaf9",
        specialtyText: "#d4a574",
        font: "manrope",
        heroStyle: "gradient",
        showWelcomeBadge: true,
        accentGlow: true,
      }),
    },
    {
      id: "rose",
      label: "Салон",
      theme: baseTheme({
        accent: "#c45c7a",
        background: "#fdf2f4",
        ink: "#4a1c2a",
        header: "#4a1c2a",
        card: "#fff7f8",
        headerText: "#fff7f8",
        specialtyText: "#f9a8d4",
        font: "cormorant",
        fontSizeTitle: "xl",
        cardStyle: "round",
        backgroundKind: "preset",
        backgroundPreset: "flowers",
      }),
    },
    {
      id: "emerald",
      label: "Изумруд",
      theme: baseTheme({
        accent: "#3d7a5c",
        background: "#f0f5f1",
        ink: "#14532d",
        header: "#14532d",
        card: "#f7fbf8",
        headerText: "#ecfdf5",
        specialtyText: "#6ee7b7",
        font: "nunito",
        backgroundKind: "preset",
        backgroundPreset: "nature",
      }),
    },
    {
      id: "lavender",
      label: "Лаванда",
      theme: baseTheme({
        accent: "#8b5cf6",
        background: "#f5f3ff",
        ink: "#4c1d95",
        header: "#5b21b6",
        card: "#faf5ff",
        headerText: "#faf5ff",
        specialtyText: "#c4b5fd",
        font: "playfair",
        fontSizeTitle: "xl",
        heroStyle: "glass",
        cardStyle: "round",
        backgroundKind: "preset",
        backgroundPreset: "watercolor",
      }),
    },
    {
      id: "sunset",
      label: "Закат",
      theme: baseTheme({
        accent: "#ea580c",
        background: "#fff7ed",
        ink: "#7c2d12",
        header: "#c2410c",
        card: "#ffedd5",
        headerText: "#fff7ed",
        specialtyText: "#fdba74",
        font: "rubik",
        heroStyle: "gradient",
        backgroundKind: "preset",
        backgroundPreset: "abstract",
        backgroundOverlay: 45,
      }),
    },
    {
      id: "ocean",
      label: "Океан",
      theme: baseTheme({
        accent: "#0284c7",
        background: "#f0f9ff",
        ink: "#0c4a6e",
        header: "#0369a1",
        card: "#e0f2fe",
        headerText: "#f0f9ff",
        specialtyText: "#7dd3fc",
        font: "montserrat",
        backgroundKind: "preset",
        backgroundPreset: "nature",
        heroStyle: "glass",
      }),
    },
    {
      id: "gold",
      label: "Премиум",
      theme: baseTheme({
        accent: "#b8860b",
        background: "#faf8f5",
        ink: "#292524",
        header: "#1c1917",
        card: "#fffcf8",
        headerText: "#fef3c7",
        specialtyText: "#d4a574",
        font: "playfair",
        fontSizeTitle: "xl",
        heroStyle: "gradient",
        cardStyle: "round",
        showWelcomeBadge: true,
        accentGlow: true,
      }),
    },
    {
      id: "minimal",
      label: "Минимал",
      theme: baseTheme({
        accent: "#525252",
        background: "#fafafa",
        ink: "#171717",
        header: "#171717",
        card: "#ffffff",
        headerText: "#ffffff",
        specialtyText: "#a3a3a3",
        font: "inter",
        fontSizeTitle: "md",
        fontSizeBody: "sm",
        cardStyle: "sharp",
      }),
    },
    {
      id: "bakery",
      label: "Кондитер",
      theme: baseTheme({
        accent: "#d97706",
        background: "#fefce8",
        ink: "#713f12",
        header: "#92400e",
        card: "#fffbeb",
        headerText: "#fffbeb",
        specialtyText: "#fcd34d",
        font: "cormorant",
        fontSizeTitle: "xl",
        backgroundKind: "preset",
        backgroundPreset: "flowers",
        cardStyle: "round",
      }),
    },
    {
      id: "barber",
      label: "Барбер",
      theme: baseTheme({
        accent: "#dc2626",
        background: "#fafafa",
        ink: "#0a0a0a",
        header: "#0a0a0a",
        card: "#f5f5f5",
        headerText: "#fafafa",
        specialtyText: "#f87171",
        font: "manrope",
        fontSizeTitle: "lg",
        heroStyle: "solid",
        cardStyle: "sharp",
        showWelcomeBadge: true,
      }),
    },
    {
      id: "neon",
      label: "Neon Studio",
      theme: baseTheme({
        accent: "#a855f7",
        background: "#09090b",
        ink: "#fafafa",
        header: "#18181b",
        card: "#27272a",
        headerText: "#fafafa",
        specialtyText: "#e879f9",
        font: "rubik",
        fontSizeTitle: "xl",
        heroStyle: "gradient",
        cardStyle: "round",
        backgroundKind: "preset",
        backgroundPreset: "city",
        backgroundOverlay: 55,
        showWelcomeBadge: true,
        accentGlow: true,
      }),
    },
  ];

const HEX = /^#[0-9a-fA-F]{6}$/;

const FONT_STACK: Record<PageFontId, string> = {
  inter: "var(--font-geist-sans), system-ui, sans-serif",
  cormorant: '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  nunito: '"Nunito", ui-rounded, system-ui, sans-serif',
  manrope: '"Manrope", system-ui, sans-serif',
  playfair: '"Playfair Display", Georgia, serif',
  rubik: '"Rubik", system-ui, sans-serif',
  montserrat: '"Montserrat", system-ui, sans-serif',
};

const FONT_HREF: Record<PageFontId, string | null> = {
  inter: null,
  cormorant:
    "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap",
  nunito:
    "https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700&display=swap",
  manrope:
    "https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700&display=swap",
  playfair:
    "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700&display=swap",
  rubik:
    "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap",
  montserrat:
    "https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700&display=swap",
};

const CARD_RADIUS: Record<PageCardStyle, string> = {
  soft: "1rem",
  round: "1.375rem",
  sharp: "0.5rem",
};

export function isPageFontId(value: unknown): value is PageFontId {
  return PAGE_FONTS.includes(value as PageFontId);
}

function isFontSize(v: unknown): v is PageFontSize {
  return v === "sm" || v === "md" || v === "lg" || v === "xl";
}

function isHeroStyle(v: unknown): v is PageHeroStyle {
  return v === "solid" || v === "gradient" || v === "glass";
}

function isCardStyle(v: unknown): v is PageCardStyle {
  return v === "soft" || v === "round" || v === "sharp";
}

function isBackgroundKind(v: unknown): v is PageBackgroundKind {
  return v === "color" || v === "preset" || v === "custom";
}

function isBackgroundPreset(v: unknown): v is PageBackgroundPreset {
  return PAGE_BACKGROUND_PRESETS.some((p) => p.id === v);
}

export function resolveThemeBackgroundUrl(theme: PageTheme): string | null {
  if (theme.backgroundKind === "preset" && theme.backgroundPreset) {
    const preset = PAGE_BACKGROUND_PRESETS.find(
      (p) => p.id === theme.backgroundPreset
    );
    return preset?.path ?? null;
  }
  if (theme.backgroundKind === "custom" && theme.backgroundImage) {
    if (theme.backgroundImage.startsWith("data:image/")) {
      return theme.backgroundImage;
    }
    if (
      theme.backgroundImage.startsWith("/uploads/") ||
      theme.backgroundImage.startsWith("http")
    ) {
      return theme.backgroundImage;
    }
  }
  return null;
}

export function mergePageTheme(partial: Partial<PageTheme>): PageTheme {
  const merged = { ...CLASSIC_PAGE_THEME, ...partial };
  if (!merged.headerText) merged.headerText = merged.card;
  if (!merged.specialtyText) merged.specialtyText = merged.accent;
  return merged;
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
  const theme = mergePageTheme({});

  for (const key of [
    "accent",
    "background",
    "ink",
    "header",
    "card",
    "headerText",
    "specialtyText",
  ] as const) {
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

  if (body.fontSizeTitle !== undefined) {
    if (!isFontSize(body.fontSizeTitle)) {
      return { ok: false, error: "Некорректный размер заголовка" };
    }
    theme.fontSizeTitle = body.fontSizeTitle;
  }
  if (body.fontSizeBody !== undefined) {
    if (!isFontSize(body.fontSizeBody)) {
      return { ok: false, error: "Некорректный размер текста" };
    }
    theme.fontSizeBody = body.fontSizeBody;
  }

  if (body.backgroundKind !== undefined) {
    if (!isBackgroundKind(body.backgroundKind)) {
      return { ok: false, error: "Некорректный тип фона" };
    }
    theme.backgroundKind = body.backgroundKind;
  }

  if (body.backgroundPreset !== undefined && body.backgroundPreset !== null) {
    if (!isBackgroundPreset(body.backgroundPreset)) {
      return { ok: false, error: "Неизвестный фон из галереи" };
    }
    theme.backgroundPreset = body.backgroundPreset;
  }

  if (body.backgroundImage !== undefined) {
    const url = String(body.backgroundImage || "");
    if (
      url &&
      !url.startsWith("/uploads/") &&
      !url.startsWith("/theme-bg/") &&
      !url.startsWith("http")
    ) {
      return { ok: false, error: "Некорректный URL фона" };
    }
    theme.backgroundImage = url;
  }

  if (body.backgroundOverlay !== undefined) {
    const n = Number(body.backgroundOverlay);
    if (!Number.isFinite(n) || n < 0 || n > 80) {
      return { ok: false, error: "Затемнение фона: 0–80" };
    }
    theme.backgroundOverlay = Math.round(n);
  }

  if (body.heroStyle !== undefined) {
    if (!isHeroStyle(body.heroStyle)) {
      return { ok: false, error: "Некорректный стиль шапки" };
    }
    theme.heroStyle = body.heroStyle;
  }

  if (body.cardStyle !== undefined) {
    if (!isCardStyle(body.cardStyle)) {
      return { ok: false, error: "Некорректный стиль карточек" };
    }
    theme.cardStyle = body.cardStyle;
  }

  if (body.showWelcomeBadge !== undefined) {
    theme.showWelcomeBadge = Boolean(body.showWelcomeBadge);
  }
  if (body.accentGlow !== undefined) {
    theme.accentGlow = Boolean(body.accentGlow);
  }

  if (theme.backgroundKind === "preset" && !theme.backgroundPreset) {
    theme.backgroundKind = "color";
  }

  return { ok: true, theme };
}

export function pageThemeDataAttrs(theme: PageTheme): Record<string, string> {
  const bgUrl = resolveThemeBackgroundUrl(theme);
  return {
    "data-hero": theme.heroStyle,
    "data-cards": theme.cardStyle,
    "data-bg": bgUrl ? "image" : "color",
    ...(theme.accentGlow ? { "data-glow": "1" } : {}),
  };
}

export function pageThemeCssVars(theme: PageTheme): CSSProperties {
  const bgUrl = resolveThemeBackgroundUrl(theme);
  return {
    ["--mz-bg" as string]: theme.background,
    ["--mz-ink" as string]: theme.ink,
    ["--mz-accent" as string]: theme.accent,
    ["--mz-header" as string]: theme.header,
    ["--mz-card" as string]: theme.card,
    ["--mz-header-text" as string]: theme.headerText,
    ["--mz-specialty-text" as string]: theme.specialtyText,
    ["--mz-font" as string]: FONT_STACK[theme.font],
    ["--mz-font-size-title" as string]: FONT_SIZE_TITLE[theme.fontSizeTitle],
    ["--mz-font-size-body" as string]: FONT_SIZE_BODY[theme.fontSizeBody],
    ["--mz-card-radius" as string]: CARD_RADIUS[theme.cardStyle],
    ["--mz-bg-overlay" as string]: String(theme.backgroundOverlay / 100),
    ...(bgUrl
      ? { ["--mz-bg-image" as string]: `url("${bgUrl}")` }
      : {}),
  } as CSSProperties;
}

export function pageThemeFontHref(font: PageFontId): string | null {
  return FONT_HREF[font];
}
