# QazMind

Платформа подготовки к ЕНТ / ҰБТ. Фронтенд на React 19 + Vite, API на FastAPI + PostgreSQL.

Статус: **этапы 0–4 выполнены** (аудит, backend, аккаунты и сессии, онбординг и профиль, учебный контент и прогресс уроков). Практика, школы и пробники ещё не подключены к серверу. Опубликованного контента пока нет: ожидается проверка методистом. Подробнее — `docs/TECHNICAL_CHECKLIST.md`.

## Структура

```
src/                 React-фронтенд (визуальный стиль сохранён)
  api/               клиент API, эндпоинты, маппинг в UI-типы
  auth/              AuthProvider: сессия из /auth/me
  components/        экраны (лендинг, auth, онбординг, кабинет, Focus, школы — демо)
  content/           учебный контент-прототип (мигрирует на сервер в этапе 4)
backend/             FastAPI-приложение
  app/api/v1/        маршруты /api/v1
  app/services/      бизнес-логика (аутентификация, профиль, почта)
  app/models/        SQLAlchemy-модели
  app/tests/         pytest
  alembic/           миграции
docs/                техническое задание, аудит этапа 0, чеклист, архив промптов
```

## Требования

- Node.js 22+ и npm
- Python 3.12+
- PostgreSQL 16+ (или `docker compose up -d db`)

## Запуск локально

1. Фронтенд:
   ```bash
   npm ci
   npm run dev          # http://localhost:3000, /api проксируется на localhost:8000
   ```
2. Бэкенд:
   ```bash
   cd backend
   python -m venv .venv && .venv/Scripts/activate      # Windows; на Linux/macOS: source .venv/bin/activate
   pip install -e ".[dev]"
   cp .env.example .env                                  # при необходимости поправить DATABASE_URL
   alembic upgrade head
   uvicorn app.main:app --reload --port 8000
   ```
3. Письма в режиме разработки **не отправляются**: ссылки подтверждения и восстановления пишутся в лог сервера (строки `DEV MAIL`).

Вариант через Docker (проверено):
```bash
docker compose up -d --build                       # PostgreSQL 16 на localhost:55432, API на localhost:8000
docker compose exec api alembic upgrade head       # миграции
docker compose exec -T db psql -U qazmind -d qazmind -c "CREATE DATABASE qazmind_test;"
docker compose exec -T -e TEST_DATABASE_URL=postgresql+asyncpg://qazmind:qazmind@db:5432/qazmind_test api pytest -q
```
Порт 55432 выбран специально: 5432 часто занят локальным PostgreSQL на машине разработчика.

## Учебный контент

Уроки загружаются файлом и публикуются только после проверки другим человеком:

```bash
cd backend
python -m app.content.cli import content/drafts/history_kz.json     # статус draft, ученики не видят
python -m app.content.cli status
python -m app.content.cli transition khanate-foundation 1 submit  --by "Автор"
python -m app.content.cli transition khanate-foundation 1 approve --by "Ревьюер"   # не автор
python -m app.content.cli transition khanate-foundation 1 publish --by "Ревьюер"
```

Файлы в `backend/content/drafts/` — непроверенные ИИ-черновики из прототипа. Их нельзя публиковать без сверки с учебником.

## Тесты

```bash
npm run lint        # TypeScript
npm test            # unit-тесты фронтенда
npm run build       # production-сборка

cd backend
TEST_DATABASE_URL=postgresql+asyncpg://qazmind:qazmind@localhost:5432/qazmind_test pytest -q
```

Тесты backend используют отдельную одноразовую БД (`TEST_DATABASE_URL`): схема пересоздаётся миграциями перед каждым запуском. Не указывайте рабочую базу.

## Переменные окружения

| Где | Переменная | Назначение |
|---|---|---|
| фронтенд | `VITE_API_BASE_URL` | адрес API; пусто — прокси Vite на `/api` |
| фронтенд | `VITE_DEMO_MODE` | `true` только для показа прототипа школ/учителей/админа |
| backend | `DATABASE_URL` | подключение к PostgreSQL |
| backend | `PUBLIC_APP_URL` | адрес фронтенда для ссылок в письмах |
| backend | `API_CORS_ORIGINS` | разрешённые origin (JSON-список) |
| backend | `COOKIE_SECURE` | `true` за HTTPS (обязательно в staging/production) |
| backend | `MAIL_MODE` | сейчас только `dev_log` (только для разработки) |

Секреты не коммитятся: `.env*` игнорируется, в репозитории только `.env.example`.

## Что ещё не готово

- Письма не доставляются: нет почтового провайдера (открытое решение ТЗ п. 22.2).
- Учебный контент, прогресс уроков и практика пока в браузере; ключи ответов лежат в клиентском коде (этапы 4–5).
- Школы, приглашения, задания и пробники — только прототип в `DEMO_MODE` (этапы 6–9).
- Визуальные скриншоты для регрессии и E2E в браузере не сняты.

Не запускайте `DEMO_MODE` и не публикуйте прототип школ как рабочий сервис: его данные выдуманы.

## Документы

- `docs/QAZMIND_TECHNICAL_SPEC.md` — техническое задание (источник требований)
- `docs/audit/stage-0.md` — аудит и реестр демо-логики
- `docs/TECHNICAL_CHECKLIST.md` — что сделано и что открыто
- `CLAUDE.md` — правила работы над проектом
