# F29 — Админ-панель владельца

## Мета

| Поле | Значение |
|------|----------|
| ID | F29 |
| Статус | done |
| Обновлено | 2026-08-14 |

## Зачем

Контролировать мастеров, канал оповещений и подписки без SSH/SQLite.

## Пользовательский сценарий

1. Открыть `/admin`, ввести `ADMIN_SETUP_KEY`
2. Список с **поиском / фильтром / сортировкой**
3. Менять канал, план, статус, `paid_until`, блок, «+30 дней»
4. **Удалить** одного мастера (с услугами и записями)
5. **Очистить всех** — кнопка + подтверждение `DELETE_ALL` (для тестовых данных)

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/api/admin/masters` | `x-admin-key` | список + query `q,status,plan,blocked,sort,order` |
| GET/PATCH/DELETE | `/api/admin/masters/[id]` | `x-admin-key` | карточка / правка / удаление |
| DELETE | `/api/admin/masters` | `x-admin-key` | `{ "confirm": "DELETE_ALL" }` |

`PATCH` поддерживает `extend_days` (1–366).

## UI

- `/admin`
- `data-testid`: `admin-key`, `admin-login`, `admin-masters`, `admin-filters`, `admin-delete-*`, `admin-purge-*`

## Тесты

- `e2e/api/admin.api.spec.ts`
