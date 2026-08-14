import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    getDb().prepare("SELECT 1 as ok").get();
    return NextResponse.json({ status: "ok", db: true });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", db: false, message: String(error) },
      { status: 500 }
    );
  }
}
