# ADR 005 — ЮKassa для оплаты подписок

## Контекст

Нужна онлайн-оплата `paid_until` (F31). Кандидаты: ЮKassa, CloudPayments.

## Решение

**ЮKassa**, одностадийный платёж + redirect confirmation + webhook `payment.succeeded`.

Причины: привычный эквайринг в РФ для SaaS, простой REST без обязательного SDK, тест-магазин.

## Последствия

- Env: `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`
- Для CI/e2e: `BILLING_MOCK=1` без реального API
- CloudPayments не внедряем до явной необходимости
- Рекуррент / автосписание — вне MVP
