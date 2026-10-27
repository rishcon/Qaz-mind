# QazMind

Платформа подготовки к ЕНТ / ҰБТ. Состоит из трёх частей, которые работают вместе:

| Часть | Папка | Адрес в разработке |
|---|---|---|
| QazMind Web — ученики, школы, лендинг | `apps/web` | http://localhost:5173 |
| QazMind Admin — панель платформы | `apps/admin` | http://localhost:5174 |
| API (FastAPI, PostgreSQL) | `apps/api` | http://localhost:8000/api/v1 |

Общий HTTP-клиент и типы: `packages/contracts`. Архитектура: `docs/ARCHITECTURE.md`. Что перенесено и что проверено: `docs/INTEGRATION.md`. Контракты API: `docs/API_CONTRACTS.md`. Чеклист этапов: `docs/TECHNICAL_CHECKLIST.md`.

## Требования

- Node.js 22 и npm
- Python 3.12 (для API)
- Docker Desktop (PostgreSQL, API и Mailpit в контейнерах)

## Первый запуск

Всё запускается одной командой в Docker: база, API (миграции применяются при старте), почта и оба фронтенда.

```bash
docker compose up -d --build
```

| Адрес | Что это |
|---|---|
| http://localhost:5173 | QazMind Web |
| http://localhost:5174 | QazMind Admin |
| http://localhost:8025 | Mailpit: все письма локального стека |
| http://localhost:8000/api/v1/docs | Документация API |

Исходники подключены как тома: правки в `apps/web/src`, `apps/admin/src`, `packages/contracts/src` и `apps/api/app` подхватываются без пересборки. После изменения `package.json` или `pyproject.toml` нужен `docker compose up -d --build`.

Без Docker фронтенды запускаются так: `npm install`, затем `npm run dev` (порты 5173 и 5174 должны быть свободны, поэтому сначала `docker compose stop web admin`).

### Первый вход в админку

Первого владельца создаёт серверная команда. Она работает один раз:

```bash
docker compose exec api python -m app.admin.cli bootstrap-owner --email you@example.com --name "Имя Фамилия"
```

Команда печатает ссылку приглашения и отправляет письмо (локально оно в Mailpit). По ссылке задаётся пароль от 12 символов; при первом входе админка показывает QR-код для Google Authenticator или Microsoft Authenticator. Остальных сотрудников владелец приглашает в разделе «Администраторы». Если сотрудник потерял телефон: `docker compose exec api python -m app.admin.cli reset-mfa --email ...`.

## Команды

| Команда | Что делает |
|---|---|
| `npm run dev` | запускает QazMind Web и QazMind Admin одновременно |
| `npm run dev:web` / `npm run dev:admin` | один фронтенд |
| `npm run build` | сборка обоих фронтендов |
| `npm run build:web` / `npm run build:admin` | сборка одного приложения |
| `npm run typecheck` | проверка типов во всех пакетах |
| `npm test` | unit-тесты фронтендов и общего пакета |

Бэкенд:

```bash
cd apps/api
python -m venv .venv && .venv/Scripts/activate      # Windows; Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
TEST_DATABASE_URL=postgresql+asyncpg://qazmind:qazmind@localhost:55432/qazmind_test pytest -q
```

Тесты API используют отдельную базу `qazmind_test`: схема пересоздаётся миграциями. Не указывайте рабочую базу.

## Почта в разработке

Все письма приложения (подтверждение, восстановление пароля) уходят в Mailpit и никуда не отправляются. Откройте http://localhost:8025, чтобы увидеть письма и нажать ссылку подтверждения. Ссылки ведут на `localhost:5173`, поэтому открывать их нужно на этом же компьютере.

## Учебный контент

Уроки загружаются файлом и публикуются только после проверки другим человеком:

```bash
cd apps/api
python -m app.content.cli import content/drafts/history_kz.json   # статус draft, ученики не видят
python -m app.content.cli status
python -m app.content.cli transition khanate-foundation 1 submit  --by "Автор"
python -m app.content.cli transition khanate-foundation 1 approve --by "Ревьюер"   # не автор
python -m app.content.cli transition khanate-foundation 1 publish --by "Ревьюер"
```

Файлы в `apps/api/content/drafts/` — непроверенные ИИ-черновики уроков. Их нельзя публиковать без сверки с учебником.

## Переменные окружения

Полный справочник: `.env.example`. Каждое приложение читает свой файл, копируется из соответствующего `.example`:

| Файл | Кому нужен |
|---|---|
| `apps/web/.env.local` | QazMind Web (Vite): `VITE_API_BASE_URL` |
| `apps/admin/.env.local` | QazMind Admin (Vite): переменных пока нет |
| `apps/api/.env` | API: `DATABASE_URL`, `PUBLIC_APP_URL`, `API_CORS_ORIGINS`, `MAIL_MODE`, `SMTP_*` |

Секреты не коммитятся: `.env*` игнорируется git, в репозитории только примеры.

## Состояние данных

Демо-режимов нет. Веб и админка показывают данные из базы. Разделы без серверной части (в админке: школы, учителя, экзамены, задания, обращения, жалобы, лицензии, настройки) помечены «скоро» и ничего не сохраняют. Модель доступа и роли: `docs/ADMIN_ACCESS.md`.

## Что работает

Проверено на запущенном стеке:
- регистрация, письмо в Mailpit, подтверждение, вход и выход;
- онбординг и профиль на сервере;
- учебный контент: опубликованный урок виден ученику, прогресс сохраняется;
- оба фронтенда запускаются одной командой, прокси `/api` работает из обоих.

## Что не готово

- Почтовый провайдер для настоящей рассылки не подключён (решение ТЗ п. 22.2).
- Практика, пробные экзамены и кабинеты школ пока не подключены к серверу: разделы говорят об этом и данных не показывают. Этапы 5–9.
- Визуальный вид обоих приложений не сверён в браузере с эталонными скриншотами.

Полный список долга: `docs/INTEGRATION.md`, раздел 4.

## Структура

```
apps/
  web/        QazMind Web (React 19, Vite 8, Tailwind 4)
  admin/      QazMind Admin (React 19, Vite 8, Tailwind 4)
  api/        FastAPI, SQLAlchemy 2 async, Alembic, pytest
packages/
  contracts/  общий HTTP-клиент, типы, пути админского API
docs/         архитектура, интеграция, контракты, промпты, аудит
scripts/      одноразовые утилиты
```
