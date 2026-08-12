# F10 — SQLite / persistence

## Мета

| Поле | Значение |
|------|----------|
| ID | F10 |
| Статус | done |
| Обновлено | 2026-08-11 |

## Решение

Используем **только** `node:sqlite` → `DatabaseSync`.  
`better-sqlite3` запрещён (segfault / EACCES native build на Mac).

## Код

- `src/lib/db.ts` — singleton `getDb()`, схема, WAL
- Файл: `data/booking.db`
- API sync: `.prepare().get|all|run`, `.exec()`

См. ADR: [../decisions/001-node-sqlite.md](../decisions/001-node-sqlite.md)
