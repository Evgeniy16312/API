import { NextResponse } from "next/server";
import { getMasterBySlug } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { listPublishedReviews } from "@/lib/reviews";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const master = getMasterBySlug(slug);

  if (!master) {
    return NextResponse.json({ error: "Мастер не найден" }, { status: 404 });
  }

  const services = getDb()
    .prepare("SELECT * FROM services WHERE master_id = ? ORDER BY sort_order, name")
    .all(master.id);

  const portfolio = getDb()
    .prepare("SELECT * FROM portfolio WHERE master_id = ? ORDER BY sort_order")
    .all(master.id);

  const reviews = listPublishedReviews(master.id);

  return NextResponse.json({
    ...master,
    token: undefined,
    services,
    portfolio,
    reviews,
  });
}
