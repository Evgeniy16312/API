# F12 — VK-бот уведомления

## Мета

| Поле | Значение |
|------|----------|
| ID | F12 |
| Статус | in_progress |
| Обновлено | 2026-08-12 |

## Сделано

- Коды `/connect КОД` (`/api/vk/connect`)
- Callback: `/api/vk/callback` (confirmation + message_new)
- UI `VkConnect` в настройках
- Env: `VK_GROUP_TOKEN`, `VK_CALLBACK_CONFIRMATION`

## Осталось на сервере

1. Сообщество VK → Callback API → `https://домен/api/vk/callback`
2. Строка подтверждения в env
3. Права messages
