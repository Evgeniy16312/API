# F29 — Админ-панель владельца

## Мета

| Поле | Значение |
|------|----------|
| ID | F29 |
| Статус | done |
| Обновлено | 2026-08-13 |

## Зачем

Контролировать мастеров, канал оповещений и подписки без SSH/SQLite.

## Пользовательский сценарий

1. Открыть `/admin`, ввести `ADMIN_SETUP_KEY`
2. Видеть список мастеров
3. Менять канал уведомлений, план, статус, `paid_until`, блок
4. Кнопка «+30 дней» — быстрое продление

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/api/admin/masters` | `x-admin-key` | список |
| GET/PATCH | `/api/admin/masters/[id]` | `x-admin-key` | карточка / правка |

`PATCH` поддерживает `extend_days` (1–366) → `paid_until` + `active` + unblock.

## UI

- `/admin` — login + список
- `data-testid`: `admin-key`, `admin-login`, `admin-masters`, `admin-extend-*`

## Данные

- `masters.plan`, `subscription_status`, `paid_until`, `blocked`
- При `blocked` / `past_due` публичная запись → 403

## Тесты

- `e2e/api/admin.api.spec.ts`
