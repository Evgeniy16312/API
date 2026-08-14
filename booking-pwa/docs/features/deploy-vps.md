# F14 — Деплой на VPS

## Мета

| Поле | Значение |
|------|----------|
| ID | F14 |
| Статус | in_progress |
| Обновлено | 2026-08-12 |

## Зачем

HTTPS-домен для продакшена, MAX webhook и пилотных мастеров.

## Сделано в репо

- `Dockerfile` + `docker-compose.yml` (standalone Next.js, volume SQLite)
- `.env.production.example`, `Caddyfile.example`
- Инструкция: [../deploy.md](../deploy.md)
- Roadmap: [../ROADMAP.md](../ROADMAP.md)

## Чеклист на сервере

- [ ] VPS + Docker
- [ ] Домен + SSL (Caddy/nginx)
- [ ] `.env.production` заполнен
- [ ] `docker compose up -d --build`
- [ ] `npm run max:setup` / `POST /api/max/setup`
- [ ] Пилотный цикл: запись → MAX

## Запуск локально как «прод»

```bash
cp .env.production.example .env.production
# отредактировать NEXT_PUBLIC_APP_URL
docker compose up -d --build
```
