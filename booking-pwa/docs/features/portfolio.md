# F06 — Портфолио

## Мета

| Поле | Значение |
|------|----------|
| ID | F06 |
| Статус | done |
| Обновлено | 2026-08-11 |

## API

| Метод | Путь | Auth |
|-------|------|------|
| GET/POST | `/api/portfolio` | Bearer |
| DELETE | `/api/portfolio/[id]` | Bearer |

`image_url` — data URL / URL; сжатие на клиенте через `compressImage` в `src/lib/client.ts`.

## UI

`/app/portfolio`
