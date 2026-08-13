# F30 — Подписки мастеров (ручное управление)

## Мета

| Поле | Значение |
|------|----------|
| ID | F30 |
| Статус | done |
| Обновлено | 2026-08-13 |

## Зачем

Понимать, кто платит, кому продлить доступ, кого отключить. Онлайн-эквайринг — отдельно (F31).

## Модель (S0)

| Поле | Значения |
|------|----------|
| `plan` | `trial` \| `basic` \| `pro` |
| `subscription_status` | `trial` \| `active` \| `past_due` \| `blocked` |
| `paid_until` | ISO date или пусто |

Правила:

- `blocked` / просроченный `past_due` → публичная запись 403, notify не шлём
- `trial` — N дней с `created_at` (константа, напр. 14)
- Продление: админ ставит `paid_until` + `active`

Тариф → feature flags (черновик):

| Флаг | trial | basic | pro |
|------|-------|-------|-----|
| booking | ✅ | ✅ | ✅ |
| notify max/vk | ✅ | ✅ | ✅ |
| notify email | ✅ | ❌? | ✅ |
| portfolio limit | 5 | 20 | ∞ |

Точные лимиты утвердим при запуске оплаты.

## UI

- Админка `/admin`: plan / status / paid_until / block
- Панель мастера: `SubscriptionBanner` (`data-testid=subscription-banner`)

## Логика

- `src/lib/subscription.ts` — trial 14 дней, lazy sync на `/api/masters/me` и при записи
- `past_due` / `blocked` → публичная запись 403

## Тесты

- `e2e/api/subscription.api.spec.ts`

## Чеклист

- [x] Поля в БД
- [x] Управление в админке
- [x] `blocked` / `past_due` → публичная запись 403
- [x] Авто-истечение trial по дате (lazy)
- [x] Баннер мастеру

## Зависимости

- F29 админ-панель
- Блокирует осмысленный F31 (оплата)
