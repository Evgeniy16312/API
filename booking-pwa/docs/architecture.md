# Архитектура МояЗапись

## Продукт

SaaS PWA для частных мастеров (барбер, маникюр, кондитер…): ссылка/QR → портфолио + онлайн-запись.  
Уведомления мастеру: **ровно один** канал — **MAX** / **VK** / **Telegram** / **email** (свитчер, F27; ADR 004/005).  
Владелец SaaS: админ-панель + подписки (F29–F30).

## Стек (сейчас)

| Слой | Выбор | Почему |
|------|-------|--------|
| UI / API | Next.js 16 App Router + TS + Tailwind | один репозиторий, SSR/PWA |
| БД | `node:sqlite` (`DatabaseSync`) | без native build; single-writer на VPS |
| Auth мастера | Bearer + httpOnly cookie `master_session`, вход по коду | F16; дальше — телефон/OTP |
| Push/чат | MAX / VK / Telegram / email (один активный) | каналы для РФ (+ Telegram через VPN) |
| Тесты | Playwright (`e2e/`) | API + UI |

## Целевые слои (обязательно держать)

```
src/app/**          → thin: HTTP in/out, auth gate, status codes
src/lib/<domain>.ts → бизнес-правила (slots, bookings, connect codes)
src/lib/db.ts       → schema, getDb, withTransaction, migrations
src/lib/http.ts     → jsonOk / jsonError / requireMaster
src/lib/*/(max|vk)  → каналы уведомлений (без SQL booking-логики)
e2e/                → контракты API/UI
docs/features/      → карточки фич
```

Правило: **route не содержит SQL длиннее 1–2 запросов без выноса в `src/lib`**.  
Новый домен → новый файл `src/lib/<name>.ts`, не раздувать `route.ts`.

## Карта маршрутов

| Путь | Кто | Назначение |
|------|-----|------------|
| `/` | все | лендинг |
| `/app/register` | мастер | регистрация |
| `/app/*` | мастер | панель |
| `/admin/*` | владелец | админка SaaS (F29) |
| `/m/[slug]` | клиент | публичная страница + запись |
| `/api/*` | сервер | JSON API |

## Данные

- Файл: `data/booking.db` (gitignore).
- Схема + лёгкие миграции: `src/lib/db.ts` (`initSchema` + `ensureMigrations`).
- Сущности: `masters`, `services`, `portfolio`, `bookings`, `max_connect_codes`.

## Стадии масштабирования

| Стадия | Нагрузка | Что можно | Что нельзя |
|--------|----------|-----------|------------|
| **S0 MVP** | 1–20 мастеров, 1 процесс | SQLite WAL, один `next start` | Несколько реплик приложения |
| **S1 Pilot** | десятки мастеров | + backup cron БД, queue/outbox для notify, картинки на диск/S3 | Несколько Node-воркеров на одну БД |
| **S2 Growth** | сотни+ | Postgres (или managed SQLite primary), cookie auth, rate limit, object storage | Хранить base64 в SQLite |

Переход S0→S1 **не ломает** слои выше: меняются только `db` adapter и storage для media.

## Инварианты

1. Открывать в IDE только `booking-pwa`.
2. Только `node:sqlite` через `getDb()` — без `better-sqlite3`.
3. Без Telegram.
4. Публичные API — по `slug`; мутации мастера — `requireMaster` / `requireAuth`.
5. `max_user_id` / `telegram_user_id` — только через connect-flow бота; `vk_user_id` — connect (временно ещё PATCH). Выбор канала — `notify_channel` (F27).
6. Создание записи: проверка overlap по длительности + транзакция; notify **не блокирует** ответ клиенту.
7. Portfolio: не класть новые большие blob в SQLite (план — файлы/S3); лимит размера на upload.
8. Фича → `docs/features/` + тест; см. skills `add-feature` / `test-feature`.
9. Один writer SQLite на процесс; перед multi-instance — Postgres или отдельный DB-сервис.

## Roadmap долга (приоритет)

1. Телефон/OTP или пароль поверх кода доступа (F16 уже cookie + recovery)  
2. Outbox/queue для уведомлений и напоминаний (F13)  
3. Файловое/S3 хранилище портфолио  
4. Versioned migrations (файлы SQL)  
5. `output: 'standalone'` + backup + VPS (F14)  
6. Rate limit на register / webhook / booking  

См. [decisions/003-scale-layers.md](./decisions/003-scale-layers.md).
