# F40 — Три тарифа (lite / basic / pro)

## Мета

| Поле | Значение |
|------|----------|
| ID | F40 |
| Статус | done |
| Владелец | продукт |
| Обновлено | 2026-08-14 |

## Зачем

Охватить мастеров с 1–2 заказами в день (блокнот), не демпингуя Витрину. ADR [007](../decisions/007-three-tier-pricing.md), [pricing.md](../business/pricing.md).

## Сценарий

1. Trial 14 дней = возможности Мастер (напоминания).
2. Оплата: Старт 149 / Мастер 290 / Витрина 590.
3. Lite: без напоминаний 24ч/2ч, без темы F38, до 5 фото.

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/api/billing/plans` | Bearer | `lite`, `basic`, `pro` |
| POST | `/api/billing/checkout` | Bearer | `{ plan: "lite" \| "basic" \| "pro" }` |
| PATCH | `/api/masters/me` | Bearer | `page_theme` только Витрина |

Env: `BILLING_LITE_PRICE_RUB` (149).

## UI

`/app/billing` три карточки, `data-testid=billing-plan-lite`. Лендинг «от 149 ₽».

## Данные

`masters.plan` = `trial` \| `lite` \| `basic` \| `pro`

## Тесты

- `e2e/api/coverage.api.spec.ts` — цены 149/290/590
- `e2e/api/page-theme.api.spec.ts` — lite → 403 тема
- `e2e/api/validate.api.spec.ts` — телефон/email

## Чеклист

- [x] Код + админка `lite`
- [x] FEATURES
- [x] Playwright
- [x] Лендинг от 149 ₽
