import Link from "next/link";
import {
  BILLING_PERIOD_LABEL,
  listPlanCatalog,
} from "@/lib/plan-catalog";

export default function BillingPlansComparePage() {
  const plans = listPlanCatalog();

  return (
    <div className="px-4 py-6 space-y-6" data-testid="billing-plans-compare">
      <div>
        <Link
          href="/app/billing"
          className="text-sm font-semibold text-[#9a7b4a] mb-4 inline-flex items-center min-h-11"
        >
          ← К оплате
        </Link>
        <h1 className="text-xl font-bold">Сравнение тарифов</h1>
        <p className="text-sm text-[#78716c] mt-1">
          Подписка продлевается на календарный месяц — столько же дней, сколько
          в выбранном месяце.
        </p>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <article key={plan.id} className="card space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-lg">{plan.title}</h2>
                <p className="text-sm text-[#78716c]">{plan.tagline}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-bold">{plan.price_rub} ₽</div>
                <div className="text-xs text-[#78716c]">
                  {BILLING_PERIOD_LABEL}
                </div>
              </div>
            </div>

            <p className="text-sm font-semibold text-[#9a7b4a]">
              {plan.daily_orders_label}
            </p>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#78716c] mb-2">
                Включено
              </h3>
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm flex gap-2">
                    <span className="text-emerald-600 shrink-0">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.excludes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[#78716c] mb-2">
                  Нет в этом тарифе
                </h3>
                <ul className="space-y-1.5">
                  {plan.excludes.map((f) => (
                    <li key={f} className="text-sm flex gap-2 text-[#78716c]">
                      <span className="shrink-0">—</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        ))}
      </div>

      <Link href="/app/billing" className="btn-primary w-full block text-center">
        Выбрать тариф и оплатить
      </Link>
    </div>
  );
}
