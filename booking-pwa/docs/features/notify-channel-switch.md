# F27 — Свитчер канала уведомлений

## Мета

| Поле | Значение |
|------|----------|
| ID | F27 |
| Статус | done |

> UI временно: в настройках мастера виден только **email** (`NOTIFY_UI_ENABLED`).  
> MAX / VK / Telegram — код на месте, скрыты до готовности внедрения.
| Обновлено | 2026-08-13 |

## Зачем

Мастер получает оповещения только в одном канале (MAX / VK / email), без дублей.

## Пользовательский сценарий

1. Мастер подключает MAX / VK / Telegram и/или указывает email.
2. В настройках выбирает активный канал свитчером.
3. Новая запись / отмена / напоминание уходят только туда.
4. Админ позже сможет переопределить канал (F29).

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| PATCH | `/api/masters/me` | master | `notify_channel`, `notify_email` |

### Контракт

```json
{ "notify_channel": "max", "notify_email": "master@mail.ru" }
```

Ошибки: `400` если канал без получателя (нет `max_user_id` / `vk_user_id` / email).

## UI

- `/app/settings` — блок «Уведомления»: radio/switch max \| vk \| email + поле email
- `data-testid`: `notify-channel`, `notify-email`

## Данные

- `masters.notify_channel` TEXT DEFAULT `'max'`
- `masters.notify_email` TEXT DEFAULT `''`

## Тесты

- `e2e/api/notify-channel.api.spec.ts`

## Зависимости

- Блокирует: корректный пилот без двойных пушей
- Зависит от: F19 outbox; email-доставка — F28
