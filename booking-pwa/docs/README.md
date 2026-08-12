# Документация МояЗапись

Единый пакет продуктовой и технической документации.  
Каждая фича описывается отдельно — агент и разработчики ссылаются на эти файлы, а не выдумывают контракты заново.

## Навигация

| Раздел | Файл |
|--------|------|
| **Roadmap** | [ROADMAP.md](./ROADMAP.md) |
| Деплой | [deploy.md](./deploy.md) |
| Каталог фич | [FEATURES.md](./FEATURES.md) |
| Архитектура | [architecture.md](./architecture.md) |
| Шаблон новой фичи | [features/_TEMPLATE.md](./features/_TEMPLATE.md) |
| ADR (решения) | [decisions/](./decisions/) |

## Правила ведения

1. **Новая фича** → копия `_TEMPLATE.md` → запись в `FEATURES.md` → статус `planned` → после мержа `done`.
2. **Изменение API / схемы БД** → обновить карточку фичи в том же PR/сессии.
3. **Важное техрешение** → короткий ADR в `decisions/`.
4. Агент обязан следовать skill `document-feature` и rule `documentation`.

## Cursor

- Rules: `.cursor/rules/`
- Skills: `.cursor/skills/`
