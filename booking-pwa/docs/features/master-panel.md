# F02 — Панель мастера (/app)

## Мета

| Поле | Значение |
|------|----------|
| ID | F02 |
| Статус | done |
| Обновлено | 2026-08-11 |

## Зачем

Единый кабинет: записи, услуги, расписание, портфолио, настройки, QR.

## Сценарий

1. Мастер с токеном открывает `/app`
2. Без токена → редирект на `/app/register`
3. BottomNav между разделами

## API

| Метод | Путь | Auth |
|-------|------|------|
| GET/PATCH | `/api/masters/me` | Bearer |

Токен: `Authorization: Bearer <token>`, клиент: `src/lib/client.ts` (`master_token` в localStorage).

## UI

- `/app`, `/app/bookings`, `/app/services`, `/app/schedule`, `/app/portfolio`, `/app/settings`
- Layout: `src/app/app/layout.tsx` + `BottomNav`
