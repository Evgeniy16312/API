"use client";

import { uploadDisplayUrl } from "@/lib/client";
import {
  pageThemeCssVars,
  pageThemeDataAttrs,
} from "@/lib/page-theme";
import type { PageTheme } from "@/lib/types";

type Props = {
  theme: PageTheme;
  name: string;
  specialty: string;
  avatarUrl?: string;
  className?: string;
  testId?: string;
};

export default function PageThemePreview({
  theme,
  name,
  specialty,
  avatarUrl,
  className = "",
  testId = "design-preview",
}: Props) {
  const bgTheme =
    theme.backgroundKind === "custom" && theme.backgroundImage
      ? {
          ...theme,
          backgroundImage: theme.backgroundImage.startsWith("data:")
            ? theme.backgroundImage
            : uploadDisplayUrl(theme.backgroundImage),
        }
      : theme;

  return (
    <div
      className={`page-theme rounded-2xl overflow-hidden border border-[#e7e0d6] shadow-sm ${className}`}
      style={pageThemeCssVars(bgTheme)}
      {...pageThemeDataAttrs(bgTheme)}
      data-testid={testId}
    >
      <div className="mz-hero px-4 py-5">
        {theme.showWelcomeBadge && (
          <span className="mz-welcome-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Запись онлайн
          </span>
        )}
        <div className="flex items-center gap-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                avatarUrl.startsWith("data:") || avatarUrl.startsWith("http")
                  ? avatarUrl
                  : uploadDisplayUrl(avatarUrl)
              }
              alt=""
              className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shrink-0"
            />
          ) : null}
          <div>
            <p className="mz-title font-bold">{name || "Ваше имя"}</p>
            <p className="mz-specialty mt-0.5">{specialty || "Специализация"}</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="card text-sm py-3 px-4">Услуга · превью карточки</div>
        <div className="btn-primary text-center text-sm py-2.5 rounded-xl">
          Записаться
        </div>
      </div>
    </div>
  );
}
