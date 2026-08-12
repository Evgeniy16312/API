# F08 — MAX-бот уведомления

## Мета

| Поле | Значение |
|------|----------|
| ID | F08 |
| Статус | in_progress |
| Обновлено | 2026-08-11 |

## Зачем

Мастер получает уведомления о новых записях в MAX (не Telegram).

## Сценарий

1. В настройках «Подключить MAX» → код `/connect ABC123`
2. Мастер пишет боту команду
3. `masters.max_user_id` сохраняется
4. Новая запись → сообщение в MAX

## API / код

| Путь | Назначение |
|------|------------|
| `/api/max/webhook` | входящие update (нужен HTTPS) |
| `/api/max/setup` | регистрация webhook (`x-admin-key`) |
| `/api/max/connect` | выдача кода |
| `src/lib/max/*` | API + bot logic |
| `src/lib/notifications.ts` | fan-out |

Env: `MAX_BOT_TOKEN`, `MAX_BOT_USERNAME`, `MAX_WEBHOOK_URL`, `MAX_WEBHOOK_SECRET`, `ADMIN_SETUP_KEY`.

## Блокер

Webhook требует публичный HTTPS (туннель или VPS).
