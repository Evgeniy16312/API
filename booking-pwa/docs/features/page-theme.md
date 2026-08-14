# F38 — Дизайн публичной страницы (Pro)

## Мета

| Поле | Значение |
|------|----------|
| ID | F38 |
| Статус | done |
| Владелец | продукт |
| Обновлено | 2026-08-14 |

## Зачем

Клиент заходит на витрину мастера. На Basic страница всегда в классическом салонном виде. Pro даёт цвета, шрифт и шапку — без произвольного CSS (XSS).

## Пользовательский сценарий

1. Trial / Basic: `/m/[slug]` — классика; `/app/design` — превью + апгрейд на Pro.
2. Активный Pro: пресеты (классика / ночь / салон / изумруд) или свои HEX + шрифт из белого списка. Сохранить → клиент видит тему.
3. Downgrade / истечение: JSON темы остаётся в БД, публично снова классика. После возврата на Pro тема возвращается.

## API

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| GET | `/api/masters/me` | Bearer | `page_theme`, `theme_customizable` |
| PATCH | `/api/masters/me` | Bearer | `{ page_theme }` только если Pro + запись разрешена |
| GET | `/api/masters/[slug]` | public | `page_theme` (применённая), `theme_custom` |

### Контракт

```json
{
  "accent": "#c45c7a",
  "background": "#fdf2f4",
  "ink": "#4a1c2a",
  "header": "#4a1c2a",
  "card": "#fff7f8",
  "font": "cormorant"
}
```

Шрифты: `inter` \| `cormorant` \| `nunito` \| `manrope`. Цвета: `#rrggbb`.

Ошибки: `403` «Свой дизайн доступен на тарифе Pro», `400` невалидный hex/шрифт.

## UI

- `/app/design` — редактор
- Ссылки: главная кабинета, настройки
- `data-testid`: `design-page`, `design-locked`, `design-preview`, `design-save`, `design-font`, `design-preset-*`

## Данные

- `masters.page_theme` TEXT JSON, миграция в `src/lib/db.ts`
- Логика: `src/lib/page-theme.ts` (клиент безопасно), `src/lib/page-theme-resolve.ts` (сервер), `canCustomizePageTheme` в `subscription.ts`

## Тесты

- API: `e2e/api/page-theme.api.spec.ts`
- UI: `e2e/design.spec.ts`
- Команда: `npx playwright test e2e/api/page-theme.api.spec.ts e2e/design.spec.ts`

## Зависимости

- F30 подписки, F03 публичная страница, F31 тарифы 290/590

## Чеклист готовности

- [x] Код + типы
- [x] Карточка в docs + строка в FEATURES.md
- [x] API/UI тесты зелёные
- [x] README / env не требуется
