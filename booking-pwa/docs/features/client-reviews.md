# F25 — Отзывы клиентов

## Мета

| Поле | Значение |
|------|----------|
| ID | F25 |
| Статус | done |
| Обновлено | 2026-08-12 |

## Зачем

Клиенты оставляют оценку на публичной странице; мастер может скрыть отзыв.

## Сценарий

1. На `/m/slug` блок «Отзывы» → имя, ★1–5, текст
2. Отзыв сразу виден
3. Кабинет `/app/reviews` → «Скрыть»

## API

| Метод | Путь | Auth |
|-------|------|------|
| POST | `/api/reviews` | public |
| GET | `/api/reviews` | master |
| PATCH | `/api/reviews/[id]` | master |
| GET | `/api/masters/[slug]` → `reviews` | public |

## UI

- `ReviewsSection` на публичной странице (`data-testid="reviews-section"`)
- `/app/reviews`

## Тесты

`e2e/api/reviews-cancel.api.spec.ts`
