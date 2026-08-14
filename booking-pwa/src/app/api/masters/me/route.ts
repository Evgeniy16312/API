import { rowToMaster } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";
import { isNotifyChannel } from "@/lib/notify-channel";
import { sanitizePageTheme } from "@/lib/page-theme";
import { isValidSlug } from "@/lib/slots";
import { isValidEmail, normalizeRuPhone } from "@/lib/validate";
import {
  canCustomizePageTheme,
  syncMasterSubscription,
} from "@/lib/subscription";

export async function GET(request: Request) {
  const master = requireMaster(request);
  if (!master) {
    return jsonError("Не авторизован", 401);
  }
  const sub = syncMasterSubscription(master.id);
  return jsonOk({
    ...master,
    plan: sub?.plan ?? master.plan,
    subscription_status: sub?.subscription_status ?? master.subscription_status,
    paid_until: sub?.paid_until ?? master.paid_until,
    blocked: sub?.blocked ?? master.blocked,
    trial_ends_at: sub?.trial_ends_at,
    booking_allowed: sub?.booking_allowed,
    subscription_banner: sub?.banner ?? null,
    theme_customizable: canCustomizePageTheme(sub),
    login_email: master.login_email || "",
    has_password: master.has_password ?? false,
  });
}

export async function PATCH(request: Request) {
  const master = requireMaster(request);
  if (!master) {
    return jsonError("Не авторизован", 401);
  }

  try {
    const body = await request.json();
    const fields: string[] = [];
    const values: import("@/lib/db").SqlParam[] = [];

    // max_user_id — только через MAX /connect. vk_user_id временно из настроек до F12.
    const allowed = [
      "name",
      "phone",
      "specialty",
      "address",
      "lat",
      "lng",
      "description",
      "avatar_url",
      "vk_user_id",
      "notify_channel",
      "notify_email",
      "work_schedule",
      "slot_duration",
      "slug",
    ] as const;

    if (body.page_theme !== undefined) {
      const sub = syncMasterSubscription(master.id);
      if (!canCustomizePageTheme(sub)) {
        return jsonError("Свой дизайн доступен на тарифе «Премиум»", 403);
      }
      const parsed = sanitizePageTheme(body.page_theme);
      if (!parsed.ok) {
        return jsonError(parsed.error, 400);
      }
      fields.push("page_theme = ?");
      values.push(JSON.stringify(parsed.theme));
    }

    for (const key of allowed) {
      if (body[key] !== undefined) {
        let value = body[key];
        if (key === "work_schedule") {
          value = JSON.stringify(body[key]);
        } else if (key === "avatar_url" && typeof body[key] === "string") {
          const { persistImageDataUrl } = await import("@/lib/uploads");
          value = persistImageDataUrl(master.id, body[key], "avatar");
        } else if (key === "slug") {
          const cleanSlug = String(body.slug || "")
            .trim()
            .toLowerCase();
          if (!isValidSlug(cleanSlug)) {
            return jsonError(
              "Адрес страницы: только латиница, цифры, дефис (от 3 символов)",
              400
            );
          }
          if (cleanSlug !== master.slug) {
            const taken = getDb()
              .prepare("SELECT id FROM masters WHERE slug = ? AND id != ?")
              .get(cleanSlug, master.id);
            if (taken) {
              return jsonError("Этот адрес уже занят, выберите другой", 409);
            }
          }
          value = cleanSlug;
        } else if (key === "notify_channel") {
          if (!isNotifyChannel(body.notify_channel)) {
            return jsonError("Неизвестный канал уведомлений", 400);
          }
          value = body.notify_channel;
        } else if (key === "phone") {
          const n = normalizeRuPhone(String(body.phone || ""));
          if (!n) {
            return jsonError("Телефон: +7 и 10 цифр", 400);
          }
          value = n;
        } else if (key === "notify_email") {
          value = String(body.notify_email || "")
            .trim()
            .toLowerCase();
          if (value && !isValidEmail(value)) {
            return jsonError("Некорректный email", 400);
          }
        }
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (fields.length === 0) {
      return jsonError("Нет данных для обновления", 400);
    }

    values.push(master.id);
    getDb()
      .prepare(`UPDATE masters SET ${fields.join(", ")} WHERE id = ?`)
      .run(...(values as (string | number)[]));

    const updated = getDb()
      .prepare("SELECT * FROM masters WHERE id = ?")
      .get(master.id) as Record<string, unknown>;

    return jsonOk(rowToMaster(updated));
  } catch (error) {
    console.error("Update master error:", error);
    return jsonError("Ошибка обновления", 500);
  }
}
