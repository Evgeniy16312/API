import {
  applySuccessfulPayment,
  getPaymentById,
  isBillingMock,
} from "@/lib/billing";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";

/** Test-only: confirm a mock checkout payment for the current master. */
export async function POST(request: Request) {
  if (!isBillingMock()) {
    return jsonError("Mock billing выключен", 404);
  }

  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);

  let body: { payment_id?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный JSON", 400);
  }

  const paymentId = body.payment_id?.trim();
  if (!paymentId) return jsonError("payment_id обязателен", 400);

  const payment = getPaymentById(paymentId);
  if (!payment || payment.master_id !== master.id) {
    return jsonError("Платёж не найден", 404);
  }

  const result = applySuccessfulPayment(paymentId, payment.external_id);
  if (!result.ok) return jsonError(result.error, 400);

  return jsonOk({
    ok: true,
    payment_id: result.payment.id,
    status: result.payment.status,
  });
}
