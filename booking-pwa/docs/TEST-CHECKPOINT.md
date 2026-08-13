# Чекпоинт тестирования

Публичный URL: https://myazapis.ru

## Локально

```bash
cd booking-pwa
npm run test:api
```

## Пилот на проде (email)

1. Регистрация мастера → Настройки → указать email → Сохранить  
2. Услуга + календарь  
3. Клиент создаёт запись на `/m/slug`  
4. Письмо приходит на email мастера (outbox `channel=email`, `status=sent`)  
5. При необходимости flush:  
   `curl -X POST https://myazapis.ru/api/cron/flush -H "x-admin-key: $CRON_SECRET"`  
   (если задан `CRON_SECRET` — нужен именно он, не `ADMIN_SETUP_KEY`)

## Админка

1. `/admin` + `ADMIN_SETUP_KEY`  
2. Виден мастер, «+30 дней» работает  

## Backup

Периодически копировать volume / `booking.db`.

## Статус пилота

- [x] Домен HTTPS  
- [x] Запись → email мастеру (F28)  
- [x] UI уведомлений: только email  
- [x] Owner alerts F34 в cron  
- [ ] Живой пилот-мастер (не тестовый slug)
