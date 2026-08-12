import { jsonOk } from "@/lib/http";
import { clearSessionCookie } from "@/lib/session";

export async function POST() {
  const response = jsonOk({ ok: true });
  return clearSessionCookie(response);
}
