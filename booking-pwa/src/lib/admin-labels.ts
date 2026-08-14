import { getPlanCatalogEntry } from "@/lib/plan-catalog";

/** Статус подписки — как в админке и для мастера. */
export const SUBSCRIPTION_STATUS_LABELS: Record<
  string,
  { label: string; hint: string }
> = {
  trial: {
    label: "Пробный период",
    hint: "14 дней после регистрации, запись включена",
  },
  active: {
    label: "Оплачено",
    hint: "Подписка активна, запись включена",
  },
  past_due: {
    label: "Не оплачено",
    hint: "Срок истёк — онлайн-запись отключена",
  },
  blocked: {
    label: "Заблокирован",
    hint: "Полная блокировка аккаунта",
  },
};

export const PLAN_LABELS: Record<string, string> = {
  trial: "Пробный период (как «Стандарт»)",
  lite: "Старт",
  basic: "Стандарт",
  pro: "Премиум",
};

export function planOptionLabel(id: string): string {
  if (id === "trial") return PLAN_LABELS.trial;
  const entry = getPlanCatalogEntry(id);
  if (entry) return `${entry.name} — ${entry.price_rub} ₽/мес`;
  return id;
}

export const NOTIFY_CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  max: "MAX",
  vk: "VK",
  telegram: "Telegram",
};

export function subscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS[status]?.label ?? status;
}

export function planLabel(plan: string): string {
  if (plan === "trial") return PLAN_LABELS.trial;
  const entry = getPlanCatalogEntry(plan);
  if (entry) return entry.name;
  return PLAN_LABELS[plan] ?? plan;
}
