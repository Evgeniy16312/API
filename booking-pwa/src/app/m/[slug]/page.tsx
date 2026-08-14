import type { Metadata } from "next";
import { getMasterBySlug } from "@/lib/auth";
import BookingFlow from "@/components/BookingFlow";

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

  return (
    <div className="min-h-screen bg-[#f4f0ea] max-w-lg mx-auto">
      <BookingFlow slug={slug} />
    </div>
  );
}
