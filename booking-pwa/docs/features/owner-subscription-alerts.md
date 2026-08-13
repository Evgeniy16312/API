# F34 — Напоминания владельцу об истекающих подписках

## Мета

| Поле | Значение |
|------|----------|
| ID | F34 |
| Статус | done |
| Обновлено | 2026-08-13 |

## Зачем

Владелец SaaS узнаёт заранее, кому продлить доступ в админке, без ручного просмотра списка каждый день.

## Пользовательский сценарий

1. Cron `/api/cron/flush` синхронизирует подписки
2. Находит мастеров, у кого trial / `paid_until` истекает в ближайшие N дней (дефолт 3)
3. Один раз на дату окончания шлёт email владельцу
4. Владелец открывает `/admin` → «+30 дней»

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST/GET | `/api/cron/flush` | `x-admin-key` | + поле `owner_alerts` в ответе |

```json
{
  "owner_alerts": {
    "candidates": 2,
    "new": 1,
    "sent": true
  }
}
```

`skipped`: `none_new` \| `no_recipient` \| `smtp_failed`.

## Код

- `src/lib/owner-alerts.ts`
- Таблица `owner_alert_log` (дедуп по `digest_key`)
- `sendPlainEmail` в `src/lib/notifications.ts`

## Env

```
ADMIN_NOTIFY_EMAIL=you@mail.ru   # иначе SMTP_USER
OWNER_ALERT_WARN_DAYS=3
# OWNER_ALERTS_DRY_RUN=1         # тесты: дедуп без SMTP
```

## Тесты

- `e2e/api/owner-alerts.api.spec.ts`

## Чеклист

- [x] Поиск истекающих trial/paid
- [x] Дедуп + email digest
- [x] Cron flush
- [x] Playwright
- [x] Docs / env example

## Зависимости

- F28 SMTP, F30 подписки, F29 админка
