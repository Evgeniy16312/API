# ADR 001 — node:sqlite вместо better-sqlite3

## Статус

Accepted (2026-08-11)

## Контекст

`better-sqlite3` на Mac вызывал падение Node-процесса при первом обращении к БД (регистрация мастера). Native rebuild через `postinstall` не решал стабильно.

## Решение

Использовать встроенный модуль `node:sqlite` (`DatabaseSync`). API почти совместим: `prepare` / `get` / `all` / `run` / `exec`.

## Последствия

- Нет native addon / node-gyp
- На Node 22 возможны ExperimentalWarning
- Запрещено возвращать `better-sqlite3` в dependencies
