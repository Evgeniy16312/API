import { getMasterByToken } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/http";
import { attachSessionCookie } from "@/lib/session";

/** Restore master session by recovery token (UUID from registration). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return jsonError("Вставьте код доступа", 400);
    }

    const master = getMasterByToken(token);
    if (!master) {
      return jsonError("Код неверный или устарел", 401);
    }

    const response = jsonOk({
      id: master.id,
      slug: master.slug,
      token,
      name: master.name,
    });
    return attachSessionCookie(response, token);
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("Ошибка входа", 500);
  }
}
