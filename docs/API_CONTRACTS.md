# API-контракты QazMind

Единый backend: FastAPI, префикс `/api/v1`, локально `http://localhost:8000`. Его используют QazMind Web (`http://localhost:5173`) и QazMind Admin (`http://localhost:5174`). Данные хранятся в одной PostgreSQL.

Раздел 1 описывает то, что **уже реализовано и проверено тестами**. Раздел 2 описывает **запланированные** административные маршруты: их пока нет на сервере, админка работает на моках.

## 0. Общие правила

- JSON, UTF-8, имена полей в `snake_case`. Даты в UTC, ISO 8601 с `Z`.
- Сессия: HttpOnly cookie `qm_session`. Браузер её не читает.
- Изменяющие запросы (`POST`, `PUT`, `PATCH`, `DELETE`) требуют:
  - cookie `qm_csrf` и заголовок `X-CSRF-Token` с тем же значением (double-submit);
  - заголовок `Origin`, если он есть, должен быть из списка `API_CORS_ORIGINS`. Иначе ответ 403 `CSRF_INVALID`.
- Получить CSRF-токен: `GET /api/v1/auth/csrf`.
- Любой ответ с ошибкой имеет вид:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Проверьте введённые данные",
    "request_id": "9f1e…",
    "details": [{ "field": "password", "message": "String should have at least 8 characters" }]
  }
}
```

`details` есть только при ошибке валидации. Заголовок `X-Request-ID` возвращается всегда.

Коды ошибок, которые использует клиент:

| HTTP | code | Смысл |
|---|---|---|
| 400 | `INVALID_OR_EXPIRED_TOKEN` | ссылка подтверждения или сброса недействительна, использована или истекла |
| 401 | `NOT_AUTHENTICATED` | нужна сессия |
| 401 | `INVALID_CREDENTIALS` | неверный email или пароль (одинаковый текст для неизвестного email) |
| 403 | `EMAIL_NOT_VERIFIED`, `ACCOUNT_DISABLED`, `CSRF_INVALID` | доступ запрещён |
| 404 | `PROFILE_NOT_FOUND`, `LESSON_NOT_FOUND`, `SUBJECT_NOT_FOUND`, `NOT_FOUND` | ресурса нет или он не опубликован |
| 409 | `ONBOARDING_REQUIRED` | сначала заполните профиль |
| 422 | `VALIDATION_ERROR` | данные не прошли проверку |
| 429 | `ACCOUNT_LOCKED` | слишком много неудачных входов |
| 503 | `MAIL_UNAVAILABLE`, `DB_UNAVAILABLE` | сервис временно недоступен |

## 1. Реализовано

### Служебные

| Метод | Путь | Ответ |
|---|---|---|
| GET | `/api/v1/health/live` | `{"status":"ok"}` |
| GET | `/api/v1/health/ready` | `{"status":"ready","database":"ok"}` или 503 `DB_UNAVAILABLE` |

### Аутентификация

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| GET | `/api/v1/auth/csrf` | — | `{"csrf_token": "…"}`, ставит cookie `qm_csrf` |
| POST | `/api/v1/auth/register` | `{name, email, password}` | 202 `{"status":"check_email"}` (одинаково для новых и существующих адресов) |
| POST | `/api/v1/auth/resend-verification` | `{email}` | 202 `{"status":"check_email"}` (кулдаун 60 с) |
| POST | `/api/v1/auth/verify-email` | `{token}` | 200 `MeResponse`, ставит `qm_session` |
| POST | `/api/v1/auth/login` | `{email, password}` | 200 `MeResponse`, ставит `qm_session` (старая сессия отзывается) |
| POST | `/api/v1/auth/logout` | — | 204, отзывает сессию |
| GET | `/api/v1/auth/me` | — | 200 `MeResponse` или 401 |
| POST | `/api/v1/auth/password/forgot` | `{email}` | 202 `{"status":"check_email"}` |
| POST | `/api/v1/auth/password/reset` | `{token, password}` | 200 `{"status":"password_updated"}`, все сессии отзываются |

`MeResponse`: `{"user": {id, name, email, email_verified, created_at}, "onboarding_completed": bool}`.

Ограничения: пароль 8–128 символов; имя 2–80; блокировка на 15 минут после 5 неудачных входов; токен подтверждения 24 часа, сброса 60 минут.

### Профиль и онбординг

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/v1/me/profile` | профиль; 404 `PROFILE_NOT_FOUND`, пока онбординг не пройден |
| PATCH | `/api/v1/me/profile` | частичное обновление; явный `null` отклоняется |
| POST | `/api/v1/me/onboarding/complete` | идемпотентно; время завершения не меняется повторно |
| GET | `/api/v1/me/workspaces` | сейчас только `personal` |
| GET | `/api/v1/catalog/profile-pairs` | 6 официальных пар предметов, публично |

Тело онбординга: `interface_lang` (`ru`|`kz`), `exam_lang`, `profile_pair_id`, `target_score` (60–140), `exam_year` (2026–2030), `exam_period` (`june_main`|`march_paid`|`ent_2027`), `daily_goal_minutes` (10–240). Период `ent_2027` допустим только с годом 2027.

### Учебный контент и прогресс

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/v1/subjects` | активные предметы; `published_lessons` — только опубликованные уроки |
| GET | `/api/v1/subjects/{subject_id}/curriculum` | темы и уроки предмета с прогрессом пользователя |
| GET | `/api/v1/lessons/{slug}` | опубликованная версия урока; черновик даёт 404 |
| PUT | `/api/v1/me/lessons/{slug}/progress` | `{last_step, completed}`; завершение только на последнем шаге |
| GET | `/api/v1/me/progress` | список прогресса пользователя |

Все эти маршруты требуют сессии. Контент публикуется CLI, а не API: см. `apps/api/app/content/cli.py`.

## 2. Запланировано: административный API

Пути согласованы с `packages/contracts/src/admin.ts` (`ADMIN_ENDPOINTS`). **На сервере их пока нет.** Админка к ним не обращается: данных не показывает, записи отказывают (см. `INTEGRATION.md`). Модель доступа — в `ADMIN_ACCESS.md`. Ниже — предлагаемые параметры; окончательные поля уточняются при создании Pydantic-схем.

Общие правила для списков:
- Пагинация: `page` (с 1), `page_size` (по умолчанию 20, максимум 100). Ответ — `Page<T>`: `{items, total, page, page_size}`.
- Поиск: `search`. Сортировка: `sort` = `field` или `-field`.
- Доступ: каждый маршрут проверяется на сервере по роли и разрешению (RBAC). Скрытие пункта меню в админке не защищает данные.

| Метод | Путь | Параметры | Кто может (план) |
|---|---|---|---|
| GET | `/api/v1/admin/me` | — | любой сотрудник с ролью платформы |
| GET | `/api/v1/admin/overview` | `period` = `today`\|`7d`\|`30d`\|`all` | OWNER, PLATFORM_ADMIN |
| GET | `/api/v1/admin/users` | `role`, `status`, `search` | PLATFORM_ADMIN, SUPPORT |
| GET | `/api/v1/admin/users/{id}` | — | PLATFORM_ADMIN, SUPPORT |
| GET | `/api/v1/admin/schools` | `status`, `city`, `search` | PLATFORM_ADMIN |
| GET | `/api/v1/admin/schools/{id}` | — | PLATFORM_ADMIN |
| GET | `/api/v1/admin/subjects` | `status` | CONTENT_EDITOR, CONTENT_REVIEWER |
| POST | `/api/v1/admin/subjects` | тело предмета | CONTENT_EDITOR |
| GET | `/api/v1/admin/lessons` | `subject_id`, `status`, `search` | CONTENT_EDITOR, CONTENT_REVIEWER |
| POST | `/api/v1/admin/lessons` | тело урока (создаётся версия `draft`) | CONTENT_EDITOR |
| GET | `/api/v1/admin/questions` | `subject_id`, `topic_id`, `status`, `search` | CONTENT_EDITOR, CONTENT_REVIEWER |
| POST | `/api/v1/admin/questions` | тело вопроса (статус `draft`) | CONTENT_EDITOR |
| PATCH | `/api/v1/admin/questions/{id}` | частичное обновление; меняет статус только по правилам жизненного цикла | CONTENT_EDITOR, CONTENT_REVIEWER |
| GET | `/api/v1/admin/exams` | `status`, `specification_id` | CONTENT_EDITOR, PLATFORM_ADMIN |
| GET | `/api/v1/admin/assignments` | `school_id`, `status` | PLATFORM_ADMIN |
| GET | `/api/v1/admin/audit` | `actor_id`, `action`, `from`, `to` | OWNER, PLATFORM_ADMIN |
| GET | `/api/v1/admin/analytics` | `period`, `subject_id` | OWNER, PLATFORM_ADMIN |
| GET | `/api/v1/admin/monitoring` | — | OWNER |

Правила, которые сервер должен соблюдать при записи:
- Автор вопроса или урока не утверждает и не публикует его (как в `apps/api/app/content/service.py`).
- Опубликованный вариант — один на урок и один на вопрос; новая публикация архивирует предыдущий.
- Экзамен собирается только из опубликованных вопросов и не публикуется, если спецификация не выполнена. В админке функция `validateExamSpecification` есть, но конструктор экзаменов её не вызывает.

Ошибки админского API используют тот же формат, что и остальной API. Дополнительно: 403 `FORBIDDEN` при нехватке разрешения, 423 `MFA_REQUIRED` для операций, которым нужна MFA.

## 3. Что должно решить сервер до подключения админки

1. Идентификаторы предметов: каталог API использует `history_kz`, `math_lit`, `reading_lit`, `math_prof`, `physics`, `biology`, `chemistry`, `geography`, `world_history`, `kaz_lang`, `kaz_lit`, `english`. В админке был предмет `cs` (информатика), которого нет в ЕНТ по профильным парам. Его судьбу решает владелец продукта.
2. Вход администраторов: сессия, MFA и роли (`OWNER`, `PLATFORM_ADMIN`, `CONTENT_EDITOR`, `CONTENT_REVIEWER`, `SUPPORT`). Сейчас есть только обычные аккаунты.
3. Экзаменационная спецификация (120 заданий, 140 баллов) должна храниться как версия в БД, а не в коде.
