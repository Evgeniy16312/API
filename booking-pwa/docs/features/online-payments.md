# F31 — Онлайн-оплата подписок (ЮKassa)

## Мета

| Поле | Значение |
|------|----------|
| ID | F31 |
| Статус | done |
| Обновлено | 2026-08-13 |

## Зачем

Мастер сам продлевает доступ картой, без ручного «+30 дней» в админке.

## Пользовательский сценарий

1. Баннер «Оплатить» или `/app/billing`
2. Выбрать Basic / Pro → редирект на ЮKassa
3. Webhook `payment.succeeded` → `paid_until` += N дней, `active`
4. Возврат на `/app/billing?paid=1`

Админский `extend_days` остаётся запасным путём.

## API

| Метод | Путь | Auth |
|-------|------|------|
| GET | `/api/billing/plans` | master |
| POST | `/api/billing/checkout` | master |
| POST | `/api/billing/yookassa/webhook` | public |
| POST | `/api/billing/mock/succeed` | master + `BILLING_MOCK=1` |

## Код

- `src/lib/billing.ts`, `src/lib/yookassa.ts`
- Таблица `payments`
- UI: `/app/billing`, CTA в `SubscriptionBanner`

## Пилот: оплата переводом

Пока нет самозанятого / ЮKassa:

- `BILLING_MODE=transfer` (или нет ключей ЮKassa — режим сам)
- На `/app/billing` — реквизиты СБП + комментарий `MZ {slug} {plan}`
- Владелец продлевает в `/admin` → «+30 дней»

Env:

```
BILLING_MODE=transfer
BILLING_TRANSFER_PHONE=+79…
BILLING_TRANSFER_BANK=Сбер
BILLING_TRANSFER_NAME=Имя
BILLING_SUPPORT_CONTACT=moyazapis@mail.ru
```

После оформления самозанятого: ключи ЮKassa + `BILLING_MODE=yookassa` (или убрать MODE — авто).

## Env (касса)

```
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
BILLING_LITE_PRICE_RUB=99
BILLING_BASIC_PRICE_RUB=249
BILLING_PRO_PRICE_RUB=499
BILLING_PERIOD_DAYS=30
BILLING_MOCK=0
```

Webhook URL в кабинете ЮKassa: `https://myazapis.ru/api/billing/yookassa/webhook`

## Тесты

- `e2e/api/billing.api.spec.ts` (mock)

## Чеклист

- [x] Checkout + webhook + mock
- [x] UI billing + banner CTA
- [x] Playwright
- [x] ADR 005
- [ ] Реальные ключи ЮKassa на VPS

## Зависимости

- F30 `extendMasterSubscription`
- ADR: [005-yookassa-billing.md](../decisions/005-yookassa-billing.md)
