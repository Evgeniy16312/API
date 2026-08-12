import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import type { Master } from "@/lib/types";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

/** Master panel gate — use in every authenticated route. */
export function requireMaster(request: Request): Master | null {
  return requireAuth(request);
}
