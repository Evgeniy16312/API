# F07 — Записи (bookings)

## Мета

| Поле | Значение |
|------|----------|
| ID | F07 |
| Статус | done |
| Обновлено | 2026-08-11 |

## API

| Метод | Путь | Auth |
|-------|------|------|
| POST | `/api/bookings` | public |
| GET | `/api/bookings` | Bearer |
| PATCH | `/api/bookings/[id]` | Bearer (смена `status`) |

Статусы: `pending` · `confirmed` · `cancelled` (и др. по коду).  
Конфликт слота → ошибка при создании.

## UI

`/app/bookings` + клиентский `BookingFlow`
