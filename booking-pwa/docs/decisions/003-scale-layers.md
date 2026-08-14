# ADR 003 — Слои и путь масштабирования

## Статус

Accepted (2026-08-12)

## Контекст

MVP монолит: SQL в route handlers, token в localStorage, картинки в SQLite, notify в запросе записи. Это ок для пилота, но ломается при нескольких процессах, росте портфолио и concurrent booking.

## Решение

1. **Слои:** `app/api` thin → `lib/<domain>` → `lib/db` / каналы.
2. **S0:** один процесс + SQLite WAL; запрет multi-instance на одной БД.
3. **Целостность слотов:** overlap по duration + UNIQUE `(master_id, date, time)` для активных записей + `withTransaction`.
4. **Notify async:** запись создаётся синхронно; MAX/VK — fire-and-forget (позже outbox).
5. **Каналы ID** выставляет только bot connect, не `PATCH /masters/me`.
6. **Миграции:** `ensureMigrations()` рядом со схемой; позже — SQL-файлы.
7. **S2:** смена storage (Postgres + object storage) без смены публичных API контрактов.

## Последствия

- Новые фичи обязаны следовать слоям (rule `scalability`).
- Рефакторинг auth/media — отдельные фичи (F15+), не скрытый scope.
