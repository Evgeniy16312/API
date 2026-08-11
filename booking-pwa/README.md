# МояЗапись — PWA для онлайн-записи мастеров

Платформа для частных мастеров (барберы, маникюр, кондитеры и др.):
- Персональная страница с портфолио и онлайн-записью
- PWA — устанавливается на iPhone и Android как приложение
- Уведомления мастеру в **MAX** и **VK** (без Telegram)
- Ссылка или QR-код для клиентов

## Быстрый старт

```bash
cd booking-pwa
cp .env.example .env.local
npm install
npm run dev
```

Откройте http://localhost:3000

## Структура

| Путь | Описание |
|------|----------|
| `/` | Лендинг |
| `/app/register` | Регистрация мастера |
| `/app` | Панель мастера (PWA) |
| `/m/[slug]` | Публичная страница мастера |

## Настройка уведомлений

### MAX
1. Создайте бота на https://business.max.ru
2. Добавьте `MAX_BOT_TOKEN` в `.env.local`
3. Мастер указывает свой MAX user ID в настройках

### VK
1. Создайте сообщество ВКонтакте
2. Получите токен с правом `messages`
3. Добавьте `VK_GROUP_TOKEN` в `.env.local`
4. Мастер указывает свой VK ID в настройках

## Деплой

```bash
npm run build
npm start
```

Рекомендуется: VPS (Selectel, Timeweb) или Yandex Cloud.
База данных SQLite хранится в `data/booking.db`.

## Стек

- Next.js 16 + TypeScript
- Tailwind CSS 4
- SQLite (better-sqlite3)
- PWA (@ducanh2912/next-pwa)
- MAX Bot API + VK API
