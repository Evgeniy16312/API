import {
  appBaseUrl,
  getBillingPlan,
  insertPendingPayment,
  isBillingMock,
  isYookassaConfigured,
  updatePaymentExternal,
  type BillingPlanId,
} from "@/lib/billing";
import { jsonError, jsonOk, requireMaster } from "@/lib/http";
import { yookassaCreatePayment } from "@/lib/yookassa";

export async function POST(request: Request) {
  const master = requireMaster(request);
  if (!master) return jsonError("Не авторизован", 401);

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Некорректный JSON", 400);
  }

  const planId = (body.plan || "lite") as BillingPlanId;
  const plan = getBillingPlan(planId);
  if (!plan) return jsonError("Неизвестный тариф", 400);

  if (isBillingMock()) {
    const payment = insertPendingPayment({
      masterId: master.id,
      plan: plan.id,
      amountRub: plan.price_rub,
      days: plan.days,
      provider: "mock",
    });
    const base = appBaseUrl(request);
    const confirmation_url = `${base}/app/billing?mock_pay=${payment.id}`;
    updatePaymentExternal(payment.id, `mock_${payment.id}`, confirmation_url);
    return jsonOk({
      payment_id: payment.id,
      confirmation_url,
      amount_rub: plan.price_rub,
      days: plan.days,
      plan: plan.id,
      mock: true,
    });
  }

  if (!isYookassaConfigured()) {
    return jsonError(
      "Картой пока нельзя — оплатите переводом на странице «Подписка» и напишите в поддержку.",
      503
    );
  }

  const payment = insertPendingPayment({
    masterId: master.id,
    plan: plan.id,
    amountRub: plan.price_rub,
    days: plan.days,
    provider: "yookassa",
  });

  const returnUrl = `${appBaseUrl(request)}/app/billing?paid=1`;
  const created = await yookassaCreatePayment({
    amountRub: plan.price_rub,
    description: `МояЗапись: тариф ${plan.label} на ${plan.days} дн.`,
    returnUrl,
    metadata: {
      payment_id: payment.id,
      master_id: master.id,
      plan: plan.id,
    },
  });

  if (!created.ok) {
    return jsonError(created.error, 502);
  }

  const confirmation_url = created.payment.confirmation!.confirmation_url!;
  updatePaymentExternal(payment.id, created.payment.id, confirmation_url);

  return jsonOk({
    payment_id: payment.id,
    confirmation_url,
    amount_rub: plan.price_rub,
    days: plan.days,
    plan: plan.id,
    mock: false,
  });
}
