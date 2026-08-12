---
name: test-feature
description: >-
  Writes and runs Playwright API/UI tests for МояЗапись. Use when verifying requests,
  registration, bookings, or when the user does not want to fill forms manually.
---

# Test feature

## Prefer automation

Do **not** ask the user to type test data in the browser to check if an API works. Use Playwright.

## Choose layer

| Goal | Command / files |
|------|-----------------|
| Быстро проверить API | `npm run test:api` or `*.api.spec.ts` |
| Форма / редирект / network | `npm run test:e2e` or `*.spec.ts` |
| Регистрация | `npm run test:register` |

## Add a test

1. Unique data: `makeMaster()` (or new `makeX` in `e2e/fixtures/`).
2. API helper in `e2e/helpers/api.ts`.
3. Assert status + body / error messages (Russian strings as in API).
4. UI: `getByTestId` → fill → `toHaveValue` → `Promise.all([waitForResponse, click])`.
5. `baseURL` = `http://localhost:3000`. If hydration broken on `127.0.0.1`, check `allowedDevOrigins` in `next.config.ts`.

## Run

```bash
npx playwright test e2e/api/<file>.api.spec.ts
# or
npm run test:api
```

Reuse existing server (`reuseExistingServer`); restart after `next.config` changes.

## Reference

`docs/features/e2e-testing.md`
