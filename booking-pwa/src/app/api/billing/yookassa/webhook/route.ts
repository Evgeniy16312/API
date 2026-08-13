import {
  applySuccessfulPayment,
  getPaymentByExternalId,
  getPaymentById,
  markPaymentCanceled,
} from "@/lib/billing";
import { jsonError, jsonOk } from "@/lib/http";
import { yookassaGetPayment } from "@/lib/yookassa";

type YooWebhookBody = {
  event?: string;
  object?: {
    id?: string;
    status?: string;
    metadata?: { payment_id?: string; master_id?: string; plan?: string };
  };
};

/**
 * YooKassa webhook. Always 200 after parse to avoid endless retries on business errors.
 * Verifies payment status via API when credentials are present.
 */
export async function POST(request: Request) {
  let body: YooWebhookBody;
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный JSON", 400);
  }

  const event = body.event || "";
  const object = body.object;
  if (!object?.id) {
    return jsonOk({ ignored: true, reason: "no_object" });
  }

  if (event === "payment.canceled") {
    const byExt = getPaymentByExternalId(object.id);
    const byMeta = object.metadata?.payment_id
      ? getPaymentById(object.metadata.payment_id)
      : null;
    const payment = byExt || byMeta;
    if (payment) markPaymentCanceled(payment.id);
    return jsonOk({ ok: true, canceled: true });
  }

  if (event !== "payment.succeeded") {
    return jsonOk({ ignored: true, reason: event || "unknown_event" });
  }

  // Prefer live status check when configured
  const live = await yookassaGetPayment(object.id);
  const status = live?.status || object.status;
  if (status && status !== "succeeded") {
    return jsonOk({ ignored: true, reason: "not_succeeded" });
  }

  const paymentId =
    object.metadata?.payment_id ||
    getPaymentByExternalId(object.id)?.id ||
    "";

  if (!paymentId) {
    console.warn("YooKassa webhook: unknown payment", object.id);
    return jsonOk({ ok: false, reason: "unknown_payment" });
  }

  const result = applySuccessfulPayment(paymentId, object.id);
  if (!result.ok) {
    console.warn("YooKassa webhook apply failed:", result.error);
    return jsonOk({ ok: false, error: result.error });
  }

  return jsonOk({ ok: true, payment_id: result.payment.id });
}
