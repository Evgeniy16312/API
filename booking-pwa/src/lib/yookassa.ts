import { randomUUID } from "crypto";
import type { BillingPlanId } from "@/lib/billing";

type YooPaymentCreateResult = {
  id: string;
  status: string;
  confirmation?: { confirmation_url?: string };
};

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim() || "";
  const secret = process.env.YOOKASSA_SECRET_KEY?.trim() || "";
  return `Basic ${Buffer.from(`${shopId}:${secret}`).toString("base64")}`;
}

export async function yookassaCreatePayment(input: {
  amountRub: number;
  description: string;
  returnUrl: string;
  metadata: {
    payment_id: string;
    master_id: string;
    plan: BillingPlanId;
  };
}): Promise<{ ok: true; payment: YooPaymentCreateResult } | { ok: false; error: string }> {
  try {
    const res = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        "Idempotence-Key": randomUUID(),
      },
      body: JSON.stringify({
        amount: {
          value: input.amountRub.toFixed(2),
          currency: "RUB",
        },
        capture: true,
        confirmation: {
          type: "redirect",
          return_url: input.returnUrl,
        },
        description: input.description,
        metadata: input.metadata,
      }),
    });

    const body = (await res.json()) as YooPaymentCreateResult & {
      description?: string;
      code?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        error: body.description || `ЮKassa ошибка ${res.status}`,
      };
    }

    if (!body.id || !body.confirmation?.confirmation_url) {
      return { ok: false, error: "ЮKassa не вернула ссылку на оплату" };
    }

    return { ok: true, payment: body };
  } catch (error) {
    console.error("YooKassa create payment error:", error);
    return { ok: false, error: "Не удалось связаться с ЮKassa" };
  }
}

/** Optional: re-fetch payment status from YooKassa (webhook verification aid). */
export async function yookassaGetPayment(
  externalId: string
): Promise<YooPaymentCreateResult | null> {
  try {
    const res = await fetch(
      `https://api.yookassa.ru/v3/payments/${encodeURIComponent(externalId)}`,
      { headers: { Authorization: authHeader() } }
    );
    if (!res.ok) return null;
    return (await res.json()) as YooPaymentCreateResult;
  } catch {
    return null;
  }
}
