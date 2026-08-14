# F26 — Отмена записи клиентом

## Мета

| Поле | Значение |
|------|----------|
| ID | F26 |
| Статус | done |
| Обновлено | 2026-08-12 |

## Зачем

После записи клиент получает ссылку и может отменить визит сам.

## Сценарий

1. После «Вы записаны!» — ссылка `/b/{manage_token}`
2. Клиент открывает → «Отменить запись»
3. Статус `cancelled`, слот свободен, outbox → мастер

## API

| Метод | Путь | Auth |
|-------|------|------|
| POST `/api/bookings` | response: `manage_token` | public |
| GET | `/api/bookings/manage/[token]` | token |
| POST | `/api/bookings/manage/[token]` `{action:"cancel"}` | token |

## UI

- `/b/[token]` — `data-testid="client-cancel"`
- экран done: `manage-booking-link`

## Данные

- `bookings.manage_token` (unique)

## Тесты

`e2e/api/reviews-cancel.api.spec.ts`
