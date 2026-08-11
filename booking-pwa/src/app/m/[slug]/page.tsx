import BookingFlow from "@/components/BookingFlow";

export default async function MasterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-[#faf9f7] max-w-lg mx-auto">
      <BookingFlow slug={slug} />
    </div>
  );
}
