# F16 — Вход и session cookie

## Мета

| Поле | Значение |
|------|----------|
| ID | F16 |
| Статус | done |
| Обновлено | 2026-08-14 |

## Зачем

Мастер не теряет кабинет после очистки localStorage: httpOnly cookie + вход по email и паролю (F41).

## Сценарий

1. Регистрация → cookie `master_session` + token в localStorage (для API)
2. `/app/login` → email + пароль → кабинет
3. Забыли доступ → восстановление по email (F41)
4. Выход → logout API чистит cookie

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/masters/login` | `{ email, password }` → cookie + JSON |
| POST | `/api/masters/logout` | очистить cookie |
| POST | `/api/masters/register` | также ставит cookie |

`requireAuth` принимает Bearer **или** cookie (внутренний session token).

## UI

- `/app/login` — `login-form`, `login-email`, `login-password`, `login-submit`
- Без сессии редирект на `/app/login` (не на register)

## Тесты

- `e2e/login.spec.ts`
- `e2e/api/bookings-services.api.spec.ts` (секция login)
