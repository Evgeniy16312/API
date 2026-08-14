import { getMasterAuthByLoginEmail } from "@/lib/master-auth";
import { verifyPassword } from "@/lib/password";
import { jsonError, jsonOk } from "@/lib/http";
import { attachSessionCookie } from "@/lib/session";

/** Login by email and password. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return jsonError("Введите email и пароль", 400);
    }

    const master = getMasterAuthByLoginEmail(email);
    if (!master?.password_hash || !verifyPassword(password, master.password_hash)) {
      return jsonError("Неверный email или пароль", 401);
    }

    const response = jsonOk({
      id: master.id,
      slug: master.slug,
      token: master.token,
      name: master.name,
      login_email: master.login_email,
    });
    return attachSessionCookie(response, master.token);
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("Ошибка входа", 500);
  }
}
