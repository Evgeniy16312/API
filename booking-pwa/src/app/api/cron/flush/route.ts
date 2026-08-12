import { flushOutbox } from "@/lib/outbox";
import { jsonError, jsonOk } from "@/lib/http";

/** Cron / manual flush of notification outbox. */
export async function POST(request: Request) {
  const key =
    request.headers.get("x-admin-key") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected =
    process.env.CRON_SECRET || process.env.ADMIN_SETUP_KEY || "";

  if (!expected || key !== expected) {
    return jsonError("Forbidden", 403);
  }

  const result = await flushOutbox(50);
  return jsonOk(result);
}

export async function GET(request: Request) {
  return POST(request);
}
