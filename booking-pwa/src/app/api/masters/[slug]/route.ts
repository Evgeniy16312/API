import { NextResponse } from "next/server";
import { getMasterBySlug } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listPublishedReviews } from "@/lib/reviews";
import { syncMasterSubscription } from "@/lib/subscription";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const master = getMasterBySlug(slug);

  if (!master) {
    return NextResponse.json({ error: "Мастер не найден" }, { status: 404 });
  }

  const sub = syncMasterSubscription(master.id);

  const services = getDb()
    .prepare(
      "SELECT * FROM services WHERE master_id = ? ORDER BY sort_order, name"
    )
    .all(master.id);

  const portfolio = getDb()
    .prepare(
      "SELECT * FROM portfolio WHERE master_id = ? ORDER BY sort_order"
    )
    .all(master.id);

  const reviews = listPublishedReviews(master.id);

  // Public payload — no tokens / chat IDs / billing internals
  return NextResponse.json({
    id: master.id,
    slug: master.slug,
    name: master.name,
    phone: master.phone,
    specialty: master.specialty,
    address: master.address,
    lat: master.lat,
    lng: master.lng,
    description: master.description,
    avatar_url: master.avatar_url,
    work_schedule: master.work_schedule,
    slot_duration: master.slot_duration,
    booking_enabled: sub?.booking_allowed ?? true,
    services,
    portfolio,
    reviews,
  });
}
