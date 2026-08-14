# F33 — Telegram-бот уведомления

## Мета

| Поле | Значение |
|------|----------|
| ID | F33 |
| Статус | done (прод: webhook на myazapis.ru) |
| Обновлено | 2026-08-13 |

## Зачем

Многие мастера в РФ всё ещё в Telegram (часто через VPN). Даём канал наравне с MAX/VK/email.

## Пользовательский сценарий

1. Настройки → выбрать канал Telegram → «Подключить Telegram»
2. Открыть бота, отправить `/connect КОД`
3. Новые записи / напоминания / отмены — в Telegram (если канал активен)

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET/POST | `/api/telegram/connect` | master | статус / новый код |
| POST | `/api/telegram/webhook` | secret header | updates |
| POST | `/api/telegram/setup` | `x-admin-key` | setWebhook |

## Данные

- `masters.telegram_user_id`
- `telegram_connect_codes`
- `notify_channel = 'telegram'`

## Env

`TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET`  
Опционально: `TELEGRAM_API_BASE` (прокси Bot API).

## Прод (RU VPS)

- Webhook `setWebhook` иногда нужно вызвать **с машины с доступом к Telegram** (Mac/VPN), не с VPS.
- Исходящий `api.telegram.org:443` с FirstVDS может таймаутить на части A-записей → в `docker-compose.yml` стоит `extra_hosts` на рабочий IP.
- Бот: `@moyazapismasters_bot`

## Тесты

- `e2e/api/notify-channel.api.spec.ts` (канал telegram)
- `e2e/api/telegram-connect.api.spec.ts`
