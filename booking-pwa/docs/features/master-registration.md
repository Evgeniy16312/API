# F01 — Регистрация мастера

## Мета

| Поле | Значение |
|------|----------|
| ID | F01 |
| Статус | done |
| Обновлено | 2026-08-11 |

## Зачем

Мастер за 2 минуты получает личную страницу `/m/{slug}` и токен панели.

## Сценарий

1. Открывает `/app/register`
2. Вводит имя, телефон, специализацию, slug
3. Получает token → редирект в `/app`

## API

| Метод | Путь | Auth |
|-------|------|------|
| POST | `/api/masters/register` | public |

```json
// request
{ "name": "Ринат", "phone": "+79991234567", "slug": "rinat", "specialty": "Барбер" }

// response 200
{ "id": "…", "slug": "rinat", "token": "…", "name": "Ринат" }
```

Ошибки: `400` пустые/невалидные поля, `409` slug занят.

Валидация: slug `^[a-z0-9][a-z0-9_-]{2,29}$`, телефон 10–15 цифр.

## UI

- `/app/register`
- `data-testid`: `register-form`, `register-name`, `register-phone`, `register-specialty`, `register-slug`, `register-submit`

## Тесты

- `e2e/api/register.api.spec.ts`
- `e2e/register.spec.ts`
- `npm run test:register`
