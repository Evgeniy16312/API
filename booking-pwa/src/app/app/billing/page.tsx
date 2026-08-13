"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/client";

type Plan = {
  id: "basic" | "pro";
  label: string;
  price_rub: number;
  days: number;
  hint: string;
};

function BillingInner() {
  const search = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (search.get("paid") === "1") setSuccess(true);
    const mockPay = search.get("mock_pay");
    if (mockPay) {
      setPaying(mockPay);
      apiFetch("/api/billing/mock/succeed", {
        method: "POST",
        body: JSON.stringify({ payment_id: mockPay }),
      })
        .then(() => {
          setSuccess(true);
          setError("");
        })
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "Ошибка подтверждения");
        })
        .finally(() => setPaying(null));
    }

    Promise.all([
      apiFetch("/api/billing/plans") as Promise<{ plans: Plan[] }>,
      apiFetch("/api/masters/me") as Promise<{
        subscription_banner?: string | null;
      }>,
    ])
      .then(([p, me]) => {
        setPlans(p.plans || []);
        setBanner(me.subscription_banner || null);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Ошибка загрузки");
      })
      .finally(() => setLoading(false));
  }, [search]);

  async function checkout(planId: string) {
    setPaying(planId);
    setError("");
    try {
      const res = (await apiFetch("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan: planId }),
      })) as { confirmation_url: string };
      if (!res.confirmation_url) throw new Error("Нет ссылки на оплату");
      window.location.href = res.confirmation_url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Не удалось начать оплату");
      setPaying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-4" data-testid="billing-page">
      <h1 className="text-xl font-bold">Подписка</h1>
      {banner && (
        <p className="text-sm text-[#6b7280]" data-testid="billing-status">
          {banner}
        </p>
      )}
      {success && (
        <div
          className="rounded-xl bg-emerald-50 text-emerald-800 text-sm px-3 py-2 border border-emerald-100"
          data-testid="billing-paid-ok"
        >
          Оплата прошла — подписка продлена. Можно принимать записи.
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-red-50 text-red-600 text-sm px-3 py-2">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="card space-y-2"
            data-testid={`billing-plan-${plan.id}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">{plan.label}</h2>
              <div className="text-lg font-bold text-[#1a1a2e]">
                {plan.price_rub} ₽
                <span className="text-xs font-normal text-[#6b7280]">
                  {" "}
                  / {plan.days} дн.
                </span>
              </div>
            </div>
            <p className="text-sm text-[#6b7280]">{plan.hint}</p>
            <button
              type="button"
              className="btn-primary w-full"
              data-testid={`billing-pay-${plan.id}`}
              disabled={paying !== null}
              onClick={() => checkout(plan.id)}
            >
              {paying === plan.id ? "Переходим…" : "Оплатить"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-[#6b7280]">
        Оплата через ЮKassa. После оплаты доступ продлевается автоматически.
      </p>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#c9a96e] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BillingInner />
    </Suspense>
  );
}
