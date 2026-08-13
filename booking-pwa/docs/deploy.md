# Деплой МояЗапись на VPS (Фаза 1)

Цель: `https://ВАШ_ДОМЕН` + работающий MAX webhook.

## Что уже в репозитории

| Файл | Назначение |
|------|------------|
| `Dockerfile` | multi-stage build, `output: 'standalone'` |
| `docker-compose.yml` | app + volume для SQLite |
| `.env.production.example` | шаблон env |
| `Caddyfile.example` | HTTPS reverse proxy (опционально) |

## Требования к серверу

- VPS Ubuntu 22.04+ (Timeweb / Selectel / любой)
- Docker + Docker Compose plugin
- Домен с A-записью на IP сервера
- Node 22+ только если деплой без Docker

## 1. Подготовка env

На сервере в папке проекта:

```bash
cp .env.production.example .env.production
nano .env.production
```

Обязательно:

```
NEXT_PUBLIC_APP_URL=https://ваш-домен.ru
MAX_BOT_TOKEN=...
MAX_BOT_USERNAME=...
MAX_WEBHOOK_URL=https://ваш-домен.ru/api/max/webhook
MAX_WEBHOOK_SECRET=длинный-секрет-от-16-символов
ADMIN_SETUP_KEY=ваш-админ-ключ
```

`NEXT_PUBLIC_*` попадает в клиентский бандл на **build** — задайте до `docker compose build`.

## 2. Сборка и запуск

```bash
docker compose up -d --build
curl -I http://127.0.0.1:3000
```

Данные SQLite: volume `booking-data` → `/app/data/booking.db`.

## 3. HTTPS (Caddy)

Установите [Caddy](https://caddyserver.com/), скопируйте `Caddyfile.example` → `/etc/caddy/Caddyfile`, подставьте домен, затем:

```bash
sudo systemctl reload caddy
```

Или nginx + certbot — любой reverse proxy на `127.0.0.1:3000`.

## 4. MAX webhook

1. Создайте бота на https://business.max.ru  
2. Токен и secret — в `.env.production`, перезапустите: `docker compose up -d --build`  
3. Зарегистрируйте webhook (с любой машины с доступом к API):

```bash
curl -X POST https://ваш-домен.ru/api/max/setup \
  -H "x-admin-key: ваш-админ-ключ"
```

Локально из репо (подставьте значения из `.env.production`):

```bash
export MAX_BOT_TOKEN=... MAX_WEBHOOK_URL=... MAX_WEBHOOK_SECRET=...
npm run max:setup
```

## 5. Чеклист «можно звать пилота»

- [x] `https://myazapis.ru` открывается с телефона  
- [x] Регистрация мастера работает  
- [x] `/m/slug` + QR ведут на страницу  
- [x] Клиент создал запись  
- [x] Мастер в Настройках указал email для уведомлений и сохранил  
- [x] Письмо о записи пришло на email мастера (outbox `sent`, пилот 2026-08-13)  
- [x] `/admin` — видно мастера, «+30 дней» работает  
- [ ] Backup: периодически копировать volume/`booking.db`

Cron flush: если в env задан `CRON_SECRET`, в заголовке нужен он (не `ADMIN_SETUP_KEY`).


## Backup (минимум)

```bash
docker compose exec app ls -la /app/data
# скопировать volume или файл booking.db на S3 / другой диск раз в сутки
```

## Без Docker (альтернатива)

```bash
npm ci
npm run build
# скопировать public и .next/static в standalone — см. Next docs output standalone
PORT=3000 node .next/standalone/server.js
```

Предпочтительнее Docker — меньше сюрпризов с Node/SQLite.
