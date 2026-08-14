import { getMasterPasswordHash, setMasterPassword } from "@/lib/master-auth";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";

/** Change password for logged-in master. */
export async function POST(request: Request) {
  const master = requireMaster(request);
  if (!master) {
    return jsonError("Не авторизован", 401);
  }

  try {
    const body = await request.json();
    const currentPassword =
      typeof body.current_password === "string" ? body.current_password : "";
    const newPassword =
      typeof body.new_password === "string" ? body.new_password : "";

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return jsonError(passwordError, 400);
    }

    const existingHash = getMasterPasswordHash(master.id);
    if (!existingHash) {
      return jsonError("Пароль не настроен", 400);
    }

    if (!currentPassword || !verifyPassword(currentPassword, existingHash)) {
      return jsonError("Текущий пароль неверный", 401);
    }

    setMasterPassword(master.id, hashPassword(newPassword));

    return jsonOk({ ok: true });
  } catch (error) {
    console.error("Set password error:", error);
    return jsonError("Не удалось обновить пароль", 500);
  }
}
