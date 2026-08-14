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
2. Активный Pro: **12 пресетов**, галерея фонов (5 + своё фото), размеры шрифта, цвета текста, стили шапки (сплошная / градиент / стекло), бейдж «Запись онлайн», свечение кнопок.
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
  "font": "cormorant",
  "headerText": "#fff7f8",
  "specialtyText": "#f9a8d4",
  "fontSizeTitle": "xl",
  "fontSizeBody": "md",
  "backgroundKind": "preset",
  "backgroundPreset": "flowers",
  "backgroundOverlay": 35,
  "heroStyle": "glass",
  "cardStyle": "round",
  "showWelcomeBadge": true,
  "accentGlow": false
}
```

Шрифты: `inter` \| `cormorant` \| `nunito` \| `manrope` \| `playfair` \| `rubik` \| `montserrat`. Фоны: `/theme-bg/*.svg` или `/uploads/.../theme/`.

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

- F30 подписки, F03 публичная страница, F31 тарифы 99/249/499

## Чеклист готовности

- [x] Код + типы
- [x] Карточка в docs + строка в FEATURES.md
- [x] API/UI тесты зелёные
- [x] README / env не требуется
