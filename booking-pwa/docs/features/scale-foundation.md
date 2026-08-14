# F15 — Масштабируемый фундамент (слои, слоты, http)

## Мета

| Поле | Значение |
|------|----------|
| ID | F15 |
| Статус | done |
| Обновлено | 2026-08-12 |

## Зачем

Пока проект маленький — заложить слои, целостность записей и безопасные инварианты, чтобы рост не требовал переписывания с нуля.

## Что сделано

- `src/lib/http.ts` — единые ответы и `requireMaster`
- `src/lib/db.ts` — `withTransaction`, `ensureMigrations`, `max_connect_codes` в основной схеме
- Overlap слотов по длительности услуги
- Notify после записи не блокирует HTTP-ответ
- `max_user_id` / `vk_user_id` убраны из клиентского PATCH
- Webhook MAX: secret обязателен вне development
- Docs/rules: architecture stages S0–S2, rule `scalability`

## Дальше

См. roadmap в `docs/architecture.md` (auth cookies, outbox, S3, Postgres).
