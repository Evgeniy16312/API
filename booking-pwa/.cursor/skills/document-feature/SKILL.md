---
name: document-feature
description: >-
  Creates or updates МояЗапись feature documentation under docs/. Use when finishing
  a feature, when the user asks to document something, or when docs are missing after code changes.
---

# Document feature

## When

- Новая фича или заметный change API/UI/DB
- Пользователь просит «задокументируй»
- Rule `documentation` сработал

## Steps

1. Open `docs/FEATURES.md` — найти ID или взять следующий.
2. Create/update `docs/features/<kebab>.md` from `_TEMPLATE.md`.
3. Fill: meta, зачем, сценарий, API table + JSON, UI routes/`data-testid`, данные, тесты, чеклист.
4. Sync status in `FEATURES.md`.
5. If decision is lasting → `docs/decisions/00N-short-name.md` (Context / Decision / Consequences).
6. Touch root `README.md` only for user-facing setup (env, deploy, bot).

## Style

- Russian for product text; code/paths in English as in repo
- Short tables > long prose
- Link related cards instead of duplicating

## Do not

- Empty stub without API/paths when code already exists
- Document Telegram flows
- Invent endpoints not in code
