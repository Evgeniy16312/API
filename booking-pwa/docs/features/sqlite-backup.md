# F35 — Автобэкап SQLite

## Мета

| Поле | Значение |
|------|----------|
| ID | F35 |
| Статус | done |
| Обновлено | 2026-08-14 |

## Зачем

Не потерять мастеров, записи и платежи при сбое диска/контейнера. Кусок S1 на S0-стеке.

## Сценарий

1. Cron раз в сутки: `POST /api/cron/backup` (или `scripts/backup-db.sh`)
2. Снимок → `data/backups/booking-YYYYMMDD-HHMMSSmmm.db` (VACUUM INTO)
3. Храним последние `BACKUP_KEEP` (дефолт 14)

## API

| Метод | Путь | Auth |
|-------|------|------|
| POST/GET | `/api/cron/backup` | `CRON_SECRET` / `ADMIN_SETUP_KEY` |

## Код

- `src/lib/backup.ts`
- `scripts/backup-db.sh`

## Env

```
BACKUP_KEEP=14
```

## Тесты

- `e2e/api/backup.api.spec.ts`

## Чеклист

- [x] API backup + prune
- [x] Скрипт для crontab
- [x] Playwright
- [x] Cron на VPS
