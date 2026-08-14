---
name: add-feature
description: >-
  Adds a МояЗапись feature end-to-end: code, docs card, Playwright tests, FEATURES.md.
  Use when the user asks to implement a new feature, endpoint, screen, or bot capability
  in booking-pwa.
---

# Add feature (МояЗапись)

## Before coding

1. Read `docs/FEATURES.md` and `docs/architecture.md`.
2. Take next free ID (`F15`…).
3. Skim similar feature card in `docs/features/`.
4. If Next.js API/UI unknown — check `node_modules/next/dist/docs/`.

## Implementation order

Copy and track:

```
Feature progress:
- [ ] 1. Docs stub (planned)
- [ ] 2. Data / db schema if needed
- [ ] 3. API routes
- [ ] 4. UI + data-testid
- [ ] 5. Playwright API (± UI)
- [ ] 6. Docs → done + FEATURES.md
```

### 1. Docs stub

Create `docs/features/<kebab-name>.md` from `_TEMPLATE.md`, add row to `FEATURES.md` with `in_progress`.

### 2–4. Code

- Layers: thin route → `src/lib/<domain>` → `getDb` / channels (`docs/architecture.md`).
- HTTP: `@/lib/http` (`requireMaster`, `jsonOk`, `jsonError`).
- DB only via `getDb()` / `withTransaction` / `node:sqlite`.
- Master mutations: `requireMaster` + `master_id`.
- Public read: slug.
- Forms: `data-testid`.
- Bookings: duration overlap + transaction; notify non-blocking.
- No Telegram; no client PATCH of `max_user_id`.
- No new base64 blobs into SQLite.

### 5. Tests

- Fixture in `e2e/fixtures/`
- Helper in `e2e/helpers/api.ts` if reusable
- `e2e/api/<name>.api.spec.ts`
- UI spec if есть форма
- Run: `npx playwright test e2e/api/<name>.api.spec.ts`

### 6. Close docs

Status `done`, fill API/UI/test sections. ADR if architectural choice.

## Done when

- Tests green
- FEATURES.md updated
- No secrets committed
