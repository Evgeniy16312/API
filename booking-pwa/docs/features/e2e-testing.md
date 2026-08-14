# F11 — E2E / API тесты

## Мета

| Поле | Значение |
|------|----------|
| ID | F11 |
| Статус | done |
| Обновлено | 2026-08-14 |

## Зачем

Не вводить данные руками: автоматическая проверка запросов и форм.

## Покрытие

- Регистрация API + UI
- Услуги, записи, слоты, overlap по duration, изоляция мастеров
- Login UI + logout/health
- Публичная страница без секретов
- Отзывы, отмена клиентом, manage 404
- Портфолио upload + изоляция
- Подписка / billing / admin delete+filter
- Owner/master expiry alerts, backup
- Полный journey: мастер → клиент → confirm → cancel → админ
- UI публичная запись на свежесозданном мастере (не пилот-slug)

## Команды

| Script | Что гоняет |
|--------|------------|
| `npm run test:api` | только API |
| `npm run test:e2e` | только UI |
| `npm run test:register` | регистрация |

`DELETE /api/admin/masters` с `DELETE_ALL` не гоняем в параллельном suite — общая SQLite.
