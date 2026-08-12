# F11 — E2E / API тесты

## Мета

| Поле | Значение |
|------|----------|
| ID | F11 |
| Статус | in_progress |
| Обновлено | 2026-08-12 |

## Зачем

Не вводить данные руками: автоматическая проверка запросов и форм.

## Покрытие сейчас

- ✅ Регистрация API + UI (`test:register`)
- ✅ Услуги CRUD/401/изоляция, записи, слоты, login API
- ✅ UI login по коду
- ✅ Prod smoke + публичная запись UI (`test:prod`)
- ❌ Portfolio / MAX webhook

## Структура

```
e2e/
  fixtures/     # makeMaster() и др.
  helpers/api.ts
  api/*.api.spec.ts
  *.spec.ts
playwright.config.ts
```

## Команды

| Script | Что гоняет |
|--------|------------|
| `npm run test:api` | только API |
| `npm run test:e2e` | только UI |
| `npm run test:register` | регистрация |
| `npm run test:prod` | API+UI против VPS (`PLAYWRIGHT_BASE_URL`) |
| `npm run test` | всё |

`baseURL`: `http://localhost:3000`. В `next.config` — `allowedDevOrigins`.

## Чеклист расширения

- [x] bookings create + conflict
- [x] slots occupied time
- [x] services CRUD + 401 + isolation
- [x] login by token
- [ ] portfolio
- [ ] MAX webhook secret
