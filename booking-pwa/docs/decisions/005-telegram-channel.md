# ADR 005 — Telegram как канал уведомлений

## Статус

Accepted (заменяет запрет Telegram из ADR 002)

## Контекст

ADR 002 исключал Telegram из‑за блокировок в РФ. На практике мастера продолжают пользоваться Telegram через VPN. Нужен четвёртый канал рядом с MAX, VK и email — по-прежнему **один активный** свитчер (F27).

## Решение

1. Канал `telegram`: `masters.telegram_user_id` + connect-коды + Bot API webhook.
2. `telegram_user_id` не принимаем из клиентского PATCH — только `/connect` в боте (как MAX).
3. Telegram не заменяет MAX/VK/email; мастер выбирает один канал.
4. ADR 002 остаётся актуальным в части «не делать Telegram единственным каналом»; полный запрет снимается этим ADR.

## Последствия

- Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_URL`, `TELEGRAM_WEBHOOK_SECRET`
- Доставка через outbox channel `telegram`
- Webhook требует HTTPS (уже есть на myazapis.ru)
