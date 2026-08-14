/** Платные тарифы — единый каталог для API, UI и лимитов. */

export type PaidPlanId = "lite" | "basic" | "pro";

export type PlanCatalogEntry = {
  id: PaidPlanId;
  /** Короткое имя: Старт */
  name: string;
  /** Заголовок в UI */
  title: string;
  price_rub: number;
  /** null = без лимита */
  daily_orders: number | null;
  daily_orders_label: string;
  /** Одна строка под заголовком на карточке */
  tagline: string;
  /** 3–4 пункта на карточке выбора */
  highlights: string[];
  /** Полный список на странице сравнения */
  features: string[];
  /** Чего нет (для сравнения) */
  excludes: string[];
};

function priceFromEnv(key: string, fallback: number): number {
  const n = Number(process.env[key] || fallback);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function catalogPrice(id: PaidPlanId): number {
  if (id === "lite") return priceFromEnv("BILLING_LITE_PRICE_RUB", 99);
  if (id === "basic") return priceFromEnv("BILLING_BASIC_PRICE_RUB", 249);
  return priceFromEnv("BILLING_PRO_PRICE_RUB", 499);
}

export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    id: "lite",
    name: "Старт",
    title: "Тариф «Старт»",
    price_rub: 99,
    daily_orders: 3,
    daily_orders_label: "До 3 заказов в день",
    tagline: "Ссылка и запись, если клиентов немного",
    highlights: [
      "До 3 заказов в день",
      "Страница записи, услуги и график",
      "Письмо о новой записи",
      "До 5 фото в портфолио",
    ],
    features: [
      "До 3 заказов в день",
      "Персональная страница /m/ваш-адрес",
      "Услуги, цены и календарь слотов",
      "QR-код и ссылка для клиентов",
      "Уведомление о записи на email",
      "Классический дизайн страницы",
      "До 5 фото в портфолио",
    ],
    excludes: [
      "Напоминания за 24 ч и 2 ч",
      "Отзывы и карта адреса",
      "MAX, Telegram, VK в уведомлениях",
      "Свой дизайн (цвета и шрифт)",
    ],
  },
  {
    id: "basic",
    name: "Стандарт",
    title: "Тариф «Стандарт»",
    price_rub: 249,
    daily_orders: 10,
    daily_orders_label: "До 10 заказов в день",
    tagline: "Для стабильного потока клиентов",
    highlights: [
      "До 10 заказов в день",
      "Напоминания вам и клиенту",
      "Отзывы и карта на странице",
      "До 20 фото в портфолио",
    ],
    features: [
      "До 10 заказов в день",
      "Всё из тарифа «Старт»",
      "Напоминания о записи за 24 ч и 2 ч",
      "Отзывы клиентов на странице",
      "Карта и адрес салона",
      "Уведомления: email, MAX, Telegram или VK — один канал на выбор",
      "До 20 фото в портфолио",
    ],
    excludes: ["Свой дизайн страницы (цвета, шрифт, шапка)"],
  },
  {
    id: "pro",
    name: "Премиум",
    title: "Тариф «Премиум»",
    price_rub: 499,
    daily_orders: null,
    daily_orders_label: "Без лимита заказов",
    tagline: "Максимум возможностей и свой стиль",
    highlights: [
      "Без лимита заказов",
      "Свой дизайн: цвета, шрифт, шапка",
      "До 100 фото в портфолио",
      "Приоритетная поддержка",
    ],
    features: [
      "Без лимита заказов в день",
      "Всё из тарифа «Стандарт»",
      "Свой дизайн страницы: 5 цветов и 4 шрифта",
      "До 100 фото в портфолио",
      "Приоритетная поддержка при оплате и настройке",
    ],
    excludes: [],
  },
];

export function getPlanCatalogEntry(id: string): PlanCatalogEntry | null {
  const entry = PLAN_CATALOG.find((p) => p.id === id);
  if (!entry) return null;
  return { ...entry, price_rub: catalogPrice(entry.id) };
}

export function listPlanCatalog(): PlanCatalogEntry[] {
  return PLAN_CATALOG.map((p) => ({
    ...p,
    price_rub: catalogPrice(p.id),
  }));
}

export const BILLING_PERIOD_LABEL = "в месяц";

/** Календарный месяц подписки (31 день в январе — месяц, не «30 дн.»). */
export function addCalendarMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}
