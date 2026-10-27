# QazMind Admin

Панель управления платформой QazMind. Часть монорепозитория, см. корневой `README.md`.

- Адрес в разработке: http://localhost:5174
- Запуск: `npm run dev:admin` из корня или `npm run dev` вместе с QazMind Web.
- Проверки: `npm run typecheck --workspace @qazmind/admin`, `npm test --workspace @qazmind/admin`, `npm run build:admin`.

## Демо-режим

Вход администраторов ещё не подключён к серверу, поэтому панель работает только в демо-режиме:

- **Разработка:** включён по умолчанию, внизу экрана плашка «ДЕМО-РЕЖИМ». Чтобы увидеть экран доступа, задайте `VITE_ADMIN_DEMO_MODE=false` в `.env.local`.
- **Production-сборка:** выключен. Без `VITE_ADMIN_DEMO_MODE=true` панель показывает только экран «доступ только для сотрудников». Не задавайте этот флаг на публичном хосте.

Данные в демо вымышленные и хранятся в памяти вкладки (`src/admin/repositories/mockDatabase.ts`). Они не сохраняются на сервере.

Подробности: `docs/INTEGRATION.md` (раздел «Технический долг»).
