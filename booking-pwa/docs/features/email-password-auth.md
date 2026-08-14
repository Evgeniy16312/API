# F41 — Вход по email и паролю

## Мета

| Поле | Значение |
|------|----------|
| ID | F41 |
| Статус | done |
| Обновлено | 2026-08-14 |

## Зачем

Мастер входит по привычному логину и паролю; при потере доступа — восстановление по email (SMTP).

## Пользовательский сценарий

1. Регистрация: email + пароль + профиль → автоматический вход
2. Вход: email + пароль на `/app/login`
3. Забыли логин/пароль → `/app/forgot-access` → письмо с логином и ссылкой сброса
4. Ссылка → `/app/reset-password?token=…` → новый пароль → вход

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/api/masters/register` | public | `{ email, password, … }` — создаёт мастера |
| POST | `/api/masters/login` | public | `{ email, password }` |
| POST | `/api/auth/forgot-access` | public | `{ email }` — письмо восстановления |
| POST | `/api/auth/reset-password` | public | `{ token, password }` |
| POST | `/api/auth/set-password` | Bearer/cookie | смена/установка пароля в кабинете |

Ошибки: `400` валидация, `401` неверные credentials, `409` email занят.

`AUTH_RETURN_RESET_TOKEN=1` (только тесты) — возвращает `reset_token` из forgot-access.

## UI

- `/app/register` — `register-email`, `register-password`
- `/app/login` — `login-email`, `login-password`
- `/app/forgot-access` — `forgot-form`
- `/app/reset-password` — `reset-form`

## Данные

- `masters.login_email` (unique, partial index)
- `masters.password_hash` (scrypt)
- `password_reset_tokens` — одноразовые токены, TTL 1 ч

## Тесты

- API: `e2e/api/auth.api.spec.ts`, `e2e/api/register.api.spec.ts`
- UI: `e2e/login.spec.ts`, `e2e/register.spec.ts`
- `npx playwright test e2e/api/auth.api.spec.ts`

## Зависимости

- F28 (SMTP) — письма в проде
- F16 (session cookie) — без изменений контракта сессии

## Чеклист готовности

- [x] Код + типы
- [x] Карточка в docs + строка в FEATURES.md
- [x] API/UI тесты
- [x] README / env — `NEXT_PUBLIC_APP_URL` для ссылок в письмах
