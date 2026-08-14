import {
  consumePasswordResetToken,
  setMasterPassword,
} from "@/lib/master-auth";
import { hashPassword, validatePassword } from "@/lib/password";
import { jsonError, jsonOk } from "@/lib/http";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token) {
      return jsonError("Ссылка недействительна", 400);
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return jsonError(passwordError, 400);
    }

    const masterId = consumePasswordResetToken(token);
    if (!masterId) {
      return jsonError("Ссылка устарела или уже использована", 400);
    }

    setMasterPassword(masterId, hashPassword(password));

    return jsonOk({ ok: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return jsonError("Не удалось сменить пароль", 500);
  }
}
