# F16 — Вход и session cookie

## Мета

| Поле | Значение |
|------|----------|
| ID | F16 |
| Статус | done |
| Обновлено | 2026-08-12 |

## Зачем

Мастер не теряет кабинет после очистки localStorage: httpOnly cookie + вход по коду доступа.

## Сценарий

1. Регистрация → cookie `master_session` + token в localStorage
2. Настройки → «Код доступа» (скопировать)
3. `/app/login` → вставить код → кабинет
4. Выход → logout API чистит cookie

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/masters/login` | `{ token }` → cookie + JSON |
| POST | `/api/masters/logout` | очистить cookie |
| POST | `/api/masters/register` | также ставит cookie |

`requireAuth` принимает Bearer **или** cookie.

## UI

- `/app/login` — `login-form`, `login-token`, `login-submit`
- Настройки: блок кода доступа
- Без сессии редирект на `/app/login` (не на register)

## Тесты

- `e2e/api/bookings-services.api.spec.ts` (секция login)
- `e2e/login.spec.ts`
