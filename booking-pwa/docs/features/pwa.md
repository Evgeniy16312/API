# F09 — PWA

## Мета

| Поле | Значение |
|------|----------|
| ID | F09 |
| Статус | done |
| Обновлено | 2026-08-11 |

## Зачем

Установка на домашний экран iPhone/Android без нативного приложения.

## Реализация

- `@ducanh2912/next-pwa` в `next.config.ts`
- `public/manifest.json`
- Offline fallback: `/offline`
- В `development` PWA отключена (`disable: true`)
