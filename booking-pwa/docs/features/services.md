# F04 — Услуги

## Мета

| Поле | Значение |
|------|----------|
| ID | F04 |
| Статус | done |
| Обновлено | 2026-08-11 |

## API

| Метод | Путь | Auth |
|-------|------|------|
| GET/POST | `/api/services` | Bearer |
| PATCH/DELETE | `/api/services/[id]` | Bearer |

Поля: `name`, `duration` (мин), `price` (₽), `sort_order`.

## UI

`/app/services`
