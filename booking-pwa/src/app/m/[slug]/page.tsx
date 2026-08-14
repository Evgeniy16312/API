import type { Metadata } from "next";
import { getMasterBySlug } from "@/lib/auth";
import BookingFlow from "@/components/BookingFlow";
import {
  pageThemeCssVars,
  pageThemeDataAttrs,
  pageThemeFontHref,
} from "@/lib/page-theme";
import { resolvePublicPageTheme } from "@/lib/page-theme-resolve";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const master = getMasterBySlug(slug);
  if (!master) {
    return { title: "Мастер не найден · МояЗапись" };
  }

  const title = `${master.name}${master.specialty ? ` — ${master.specialty}` : ""} · МояЗапись`;
  const description =
    master.description?.slice(0, 160) ||
    `Онлайн-запись к мастеру ${master.name}. Портфолио, услуги и свободное время.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      ...(master.avatar_url ? { images: [master.avatar_url] } : {}),
    },
  };
}

export default async function MasterPage({ params }: Props) {
  const { slug } = await params;
  const master = getMasterBySlug(slug);
  const { theme } = resolvePublicPageTheme(master);
  const fontHref = pageThemeFontHref(theme.font);

  return (
    <div
      className="page-theme min-h-screen max-w-lg mx-auto"
      style={pageThemeCssVars(theme)}
      {...pageThemeDataAttrs(theme)}
      data-testid="public-page"
    >
      {fontHref ? (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link rel="stylesheet" href={fontHref} />
      ) : null}
      <BookingFlow slug={slug} />
    </div>
  );
}
