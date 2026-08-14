import { getMasterByLoginEmail } from "@/lib/master-auth";
import {
  createPasswordResetToken,
  sendAccessRecoveryEmail,
} from "@/lib/master-auth";
import { jsonError, jsonOk } from "@/lib/http";
import { isValidEmail, normalizeLoginEmail } from "@/lib/validate";

const GENERIC_OK = {
  message:
    "Если email зарегистрирован, мы отправили письмо с логином и ссылкой для смены пароля",
};

/** Forgot login/password — one email with login reminder + reset link. */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeLoginEmail(body.email);

    if (!email || !isValidEmail(email)) {
      return jsonError("Укажите корректный email", 400);
    }

    const master = getMasterByLoginEmail(email);
    if (master?.login_email) {
      const resetToken = createPasswordResetToken(master.id);
      void sendAccessRecoveryEmail(
        { ...master, login_email: master.login_email },
        resetToken
      );

      if (process.env.AUTH_RETURN_RESET_TOKEN === "1") {
        return jsonOk({ ...GENERIC_OK, reset_token: resetToken });
      }
    }

    return jsonOk(GENERIC_OK);
  } catch (error) {
    console.error("Forgot access error:", error);
    return jsonError("Не удалось отправить письмо", 500);
  }
}
