# F32 — MAX webhook в проде

## Мета

| Поле | Значение |
|------|----------|
| ID | F32 |
| Статус | planned |
| Обновлено | 2026-08-13 |

## Зачем

Домен `https://myazapis.ru` уже с SSL — можно зарегистрировать webhook MAX и закрыть пилот уведомлений.

## Шаги

1. Env на VPS: `MAX_BOT_TOKEN`, `MAX_WEBHOOK_URL=https://myazapis.ru/api/max/webhook`, secret  
2. `POST /api/max/setup` с `x-admin-key` или `npm run max:setup`  
3. Мастер `/connect` → тест записью

## Зависимости

- F08, F14 (HTTPS ✅)
