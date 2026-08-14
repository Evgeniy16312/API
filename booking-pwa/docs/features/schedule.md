# F05 — Расписание

## Мета

| Поле | Значение |
|------|----------|
| ID | F05 |
| Статус | done |
| Обновлено | 2026-08-11 |

## Зачем

Мастер задаёт рабочие дни/часы; слоты считаются в `src/lib/slots.ts`.

## Данные

`masters.work_schedule` — JSON (`DEFAULT_SCHEDULE` в `src/lib/types.ts`).  
`masters.slot_duration` — шаг слота по умолчанию.

## UI / API

- UI: `/app/schedule` — зелёные слоты свободны, красные заняты (с учётом записей)
- Обновление через `PATCH /api/masters/me`
- Публичные слоты: `GET /api/slots`
- Календарь мастера: `GET /api/masters/schedule/slots?date=&service_id=`
