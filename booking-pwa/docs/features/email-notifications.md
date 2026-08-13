# F28 — Email-уведомления (Mail.ru SMTP)

## Мета

| Поле | Значение |
|------|----------|
| ID | F28 |
| Статус | done |
| Обновлено | 2026-08-13 |

## Зачем

Основной канал, пока MAX требует кабинет партнёра (ИП/самозанятый).  
Письма шлёт платформа; мастер указывает свой ящик (`notify_email`).

## Как получить SMTP у Mail.ru

1. Создать ящик, например `moyazapis@mail.ru` на [mail.ru](https://mail.ru)
2. Войти → ⚙️ **Настройки** → **Все настройки** → **Безопасность**
3. Раздел **Пароли для внешних приложений** → создать пароль (имя: `МояЗапись`)
4. Скопировать **пароль приложения** (не обычный пароль входа)

Прислать оператору:

```
SMTP_USER=moyazapis@mail.ru
SMTP_PASS=пароль_приложения
```

Остальное стандартно: `smtp.mail.ru:465`, SSL.

## Env на VPS

```
SMTP_HOST=smtp.mail.ru
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=МояЗапись <тот_же@mail.ru>
```

## Код

- Outbox `email` + `nodemailer` в `src/lib/notifications.ts`
- Дефолт канала для новых мастеров: `email`

## Чеклист

- [x] Код доставки
- [x] Дефолт канала email
- [x] SMTP env на VPS (`moyazapis@mail.ru`)
- [x] Тестовое письмо с VPS (SMTP_OK)
- [x] Проверка полного цикла: запись → outbox email → `sent` (пилот `pilot50830`, 2026-08-13)

## Зависимости

- F27 (`notify_channel=email`, `notify_email`)
