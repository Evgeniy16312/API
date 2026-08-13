# F28 — Email-уведомления (Mail.ru SMTP)

## Мета

| Поле | Значение |
|------|----------|
| ID | F28 |
| Статус | in_progress |
| Обновлено | 2026-08-13 |

## Зачем

Третий популярный в РФ канал: письмо на почту мастера (часто Mail.ru / Inbox / BK).

## Как

- Outbox channel `email` + `sendEmailNotification` (`nodemailer`) — код уже в `src/lib/notifications.ts`
- Отправка с платформенного ящика через SMTP
- Рекомендуемый провайдер для РФ: `smtp.mail.ru:465` (SSL)
- Осталось: завести ящик, прописать env на VPS, прогнать тест письмо

## Чеклист

- [x] Код доставки
- [ ] SMTP env на VPS
- [ ] Проверка письма на @mail.ru

## Env

```
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=noreply@yourdomain.ru
SMTP_PASS=...
SMTP_FROM="МояЗапись <noreply@yourdomain.ru>"
```

## Зависимости

- F27 (`notify_channel=email`, `notify_email`)
