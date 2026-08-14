"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/client";

type Plan = {
  id: "lite" | "basic" | "pro";
  label: string;
  price_rub: number;
  days: number;
  hint: string;
};

type TransferInfo = {
  phone: string;
  bank: string;
  recipient: string;
  support: string;
  note: string;
  comments: { lite: string; basic: string; pro: string };
};

function BillingInner() {
  const search = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [mode, setMode] = useState<"mock" | "yookassa" | "transfer">(
    "transfer"
  );
  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [selected, setSelected] = useState<"lite" | "basic" | "pro">("lite");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

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
      apiFetch("/api/billing/plans") as Promise<{
        mode: "mock" | "yookassa" | "transfer";
        plans: Plan[];
        transfer: TransferInfo | null;
      }>,
      apiFetch("/api/masters/me") as Promise<{
        subscription_banner?: string | null;
      }>,
    ])
      .then(([p, me]) => {
        setPlans(p.plans || []);
        setMode(p.mode || "transfer");
        setTransfer(p.transfer);
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

  async function copyText(label: string, value: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      setError("Не удалось скопировать");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#c4a574] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const plan = plans.find((p) => p.id === selected) || plans[0];
  const comment =
    transfer && plan
      ? transfer.comments[plan.id]
      : "";

  return (
    <div className="px-4 py-6 space-y-4" data-testid="billing-page">
      <h1 className="text-xl font-bold">Подписка</h1>
      {banner && (
        <p className="text-sm text-[#78716c]" data-testid="billing-status">
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
        {plans.map((p) => (
          <button
            key={p.id}
            type="button"
            data-testid={`billing-plan-${p.id}`}
            onClick={() => setSelected(p.id)}
            className={`card w-full text-left space-y-1 border transition min-h-16 ${
              selected === p.id
                ? "border-[#c4a574] bg-[#c4a574]/10"
                : "border-transparent"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-semibold">{p.label}</h2>
              <div className="text-lg font-bold text-[#1c1917]">
                {p.price_rub} ₽
                <span className="text-xs font-normal text-[#78716c]">
                  {" "}
                  / {p.days} дн.
                </span>
              </div>
            </div>
            <p className="text-sm text-[#78716c]">{p.hint}</p>
          </button>
        ))}
      </div>

      {mode === "transfer" && transfer && plan && (
        <div
          className="card space-y-3"
          data-testid="billing-transfer-block"
        >
          <h3 className="font-semibold">Оплата переводом (пилот)</h3>
          <p className="text-sm text-[#78716c]">
            Пока подключаем онлайн-кассу, оплата — по СБП. После перевода
            напишите нам — продлим доступ в течение дня.
          </p>

          <div className="space-y-2 text-sm">
            <Row
              label="Сумма"
              value={`${plan.price_rub} ₽`}
              testId="billing-transfer-amount"
              onCopy={() => copyText("amount", String(plan.price_rub))}
              copied={copied === "amount"}
            />
            <Row
              label="Телефон (СБП)"
              value={transfer.phone || "уточните у поддержки"}
              testId="billing-transfer-phone"
              onCopy={
                transfer.phone
                  ? () => copyText("phone", transfer.phone)
                  : undefined
              }
              copied={copied === "phone"}
            />
            <Row label="Банк" value={transfer.bank} />
            <Row label="Получатель" value={transfer.recipient} />
            <Row
              label="Комментарий к переводу"
              value={comment}
              testId="billing-transfer-comment"
              onCopy={() => copyText("comment", comment)}
              copied={copied === "comment"}
            />
          </div>

          <p className="text-xs text-[#78716c]">{transfer.note}</p>
          <p className="text-sm">
            Поддержка:{" "}
            <span className="font-medium" data-testid="billing-support">
              {transfer.support}
            </span>
          </p>
        </div>
      )}

      {(mode === "yookassa" || mode === "mock") && plan && (
        <>
          <button
            type="button"
            className="btn-primary w-full"
            data-testid={`billing-pay-${plan.id}`}
            disabled={paying !== null}
            onClick={() => checkout(plan.id)}
          >
            {paying === plan.id ? "Переходим…" : `Оплатить ${plan.price_rub} ₽`}
          </button>
          <p className="text-xs text-[#78716c]">
            Оплата через ЮKassa. После оплаты доступ продлевается автоматически.
          </p>
        </>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  testId,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  testId?: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-[#f4f0ea] px-3 py-2">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-[#78716c]">
          {label}
        </div>
        <div className="font-medium break-all" data-testid={testId}>
          {value}
        </div>
      </div>
      {onCopy && (
        <button
          type="button"
          className="text-xs text-[#c4a574] shrink-0 pt-1"
          onClick={onCopy}
        >
          {copied ? "Скопировано" : "Копировать"}
        </button>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#c4a574] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <BillingInner />
    </Suspense>
  );
}
