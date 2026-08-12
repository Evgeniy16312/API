# F03 — Публичная страница и онлайн-запись

## Мета

| Поле | Значение |
|------|----------|
| ID | F03 |
| Статус | done |
| Обновлено | 2026-08-11 |

## Зачем

Клиент по ссылке/QR выбирает услугу, дату, время и оставляет телефон.

## Сценарий

1. Открывает `/m/[slug]`
2. Смотрит услуги/портфолио
3. Проходит `BookingFlow` → создаётся booking

## API

| Метод | Путь | Auth |
|-------|------|------|
| GET | `/api/masters/[slug]` | public |
| GET | `/api/slots?slug&service_id&date` | public |
| POST | `/api/bookings` | public (по slug мастера в теле) |

## UI

- `/m/[slug]`
- `src/components/BookingFlow.tsx`, `QRShare.tsx`
