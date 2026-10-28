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
| GET | `/api/v1/practice/subjects` | предметы, по которым есть опубликованные вопросы, и их число |
| POST | `/api/v1/practice/sessions` | `{subject_id, count 1–20}`; сервер выбирает вопросы (сначала не виденные, затем с ошибками); 409 `NO_QUESTIONS`, если нечего давать; ключ и пояснение в ответ не входят |
| GET | `/api/v1/practice/sessions/{id}` | возобновление: те же вопросы и уже данные ответы с разбором; чужая сессия даёт 404 |
| POST | `/api/v1/practice/sessions/{id}/answers` | `{question_id, selected_label}`; сервер проверяет и только после сохранения возвращает `correct_label` и пояснение; повтор даёт 409 `ALREADY_ANSWERED` |
| POST | `/api/v1/practice/sessions/{id}/finish` | завершает сессию, возвращает итог |
| GET | `/api/v1/practice/stats` | `{answered, correct}` по сохранённым ответам пользователя |
| GET | `/api/v1/practice/mistakes` | опубликованные вопросы, на которые ученик отвечал неверно, с ключом и пояснением (он их уже видел); `resolved`, если последний ответ верный; сначала неразобранные |
| POST | `/api/v1/practice/mistakes/{question_id}/retry` | `{selected_label}`; повторный ответ сохраняется как однозадачная завершённая сессия; вопроса не из ошибок ученика даёт 404 |

Все эти маршруты требуют сессии. Контент публикуется CLI, а не API: см. `apps/api/app/content/cli.py`.

### Школы (этап 6)

Все маршруты требуют сессии ученика; id пользователя берётся из сессии. Чужая или несуществующая организация даёт 404 (существование чужих школ не раскрывается), недостаточная роль внутри своей организации даёт 403. Приостановленная организация не изменяется (403 `ORGANIZATION_NOT_ACTIVE`).

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/api/v1/school-applications` | заявка школы (`pending`); вторая открытая заявка даёт 409 `APPLICATION_PENDING`. Организацию заявка не создаёт |
| GET | `/api/v1/school-applications/mine` | свои заявки и их статус |
| GET | `/api/v1/me/organizations` | организации, где у пользователя активное членство, и роль (`SCHOOL_ADMIN`/`TEACHER`) |
| GET | `/api/v1/organizations/{org}` | организация и роль вызывающего |
| GET/POST | `/api/v1/organizations/{org}/classes` | список (администратор школы — все, учитель — только назначенные) / создание (только администратор школы; дубль названия в учебном году даёт 409 `CLASS_EXISTS`) |
| GET/PATCH | `/api/v1/organizations/{org}/classes/{id}` | карточка; PATCH `{name?, status?}` — только администратор школы |
| GET | `/api/v1/organizations/{org}/teachers` | учителя организации и их классы (администратор школы) |
| POST | `/api/v1/organizations/{org}/teachers/{user}/classes` | `{class_ids}` — полная замена классов учителя; классы только этой организации |

Платформа (`/api/v1/admin`, сессия сотрудника с MFA):

| Метод | Путь | Право |
|---|---|---|
| GET | `/admin/school-applications?status=` | `schools.read` |
| POST | `/admin/school-applications/{id}/approve` | `schools.approve`; в одной транзакции создаёт организацию и делает заявителя `SCHOOL_ADMIN` |
| POST | `/admin/school-applications/{id}/reject` | `schools.approve`; `{reason}` ≥ 5 символов |
| GET | `/admin/organizations` | `schools.read`; число классов, учителей, учеников |

Решения аудируются (`school_application.approve/reject`). Письма заявителю о решении пока не отправляются.

### Приглашения, коды классов, лицензии (этап 7)

Токен приглашения и код класса хранятся только в виде хеша. Приглашение отправляется письмом (в разработке — в Mailpit), ссылка `…/invite?token=…`. Принять его может только вошедший пользователь с тем же email; отозванное, просроченное и использованное приглашение не работает по сохранённой ссылке (410). Повторная отправка заменяет токен: прежняя ссылка перестаёт работать.

| Метод | Путь | Кто | Назначение |
|---|---|---|---|
| GET/POST | `/organizations/{org}/invitations` | список — админ школы; создание — админ школы (учитель или ученик) и учитель (ученик в свой класс) | `{email, role: TEACHER/STUDENT, class_id?}`; для ученика класс обязателен; дубль даёт 409 `INVITATION_EXISTS` |
| POST | `/organizations/{org}/invitations/{id}/resend` · `/revoke` | админ школы | |
| POST | `/invitations/accept` | вошедший пользователь | `{token}`; ошибки: 404 `INVITATION_INVALID`, 410 `INVITATION_REVOKED/USED/EXPIRED`, 403 `INVITATION_EMAIL_MISMATCH` |
| GET/POST | `/organizations/{org}/classes/{id}/join-codes` | админ школы, учитель класса | `{valid_days 1–60, max_uses 1–1000}`; полный код (`XXXX-XXXX`) возвращается только при создании |
| POST | `…/join-codes/{code}/revoke` | то же | |
| POST | `/classes/join-requests` | любой вошедший | `{code}`; создаёт заявку `pending`; любой негодный код (неизвестный, отозванный, просроченный, исчерпанный) даёт одинаковый 404 `CODE_INVALID` |
| GET | `/me/join-requests` · `/me/school-classes` | ученик | свои заявки и классы |
| GET | `/organizations/{org}/classes/{id}/join-requests` · `/students` | админ школы, учитель класса | |
| POST | `/classes/join-requests/{id}/approve` · `/reject` | админ школы, учитель класса | одобрение занимает место лицензии |
| POST | `/organizations/{org}/classes/{id}/students/{user}/remove` | то же | освобождает место, если ученик не состоит в других классах школы; личный прогресс не затрагивается |
| GET | `/organizations/{org}/licenses` | админ школы | места: `seat_limit`, `seats_used`, `current` |

Платформа: `GET/POST /admin/organizations/{id}/licenses` (чтение — `schools.read`, создание и `…/{lid}/cancel` — `finance.manage`, аудит `license.create/cancel`). Место нужно только ученику; без действующей лицензии вступление ученика в класс даёт 409 `NO_LICENSE`, при исчерпанном лимите — 409 `NO_SEATS`. Места считаются под блокировкой строки лицензии (параллельные одобрения не превышают лимит; проверено тестом). Платежи не подключены: лицензию записывает сотрудник платформы.

### Задания школы (этап 8)

Попытки школьных заданий хранятся отдельно от личной практики (`assignment_attempts`, `assignment_answers`): школьный результат не попадает в личную статистику и «Мои ошибки» и не меняется при смене школы. Ответы проверяются по тому же банку и ключу. Состав вопросов фиксируется при публикации (случайная выборка из опубликованных) и не меняется. Ключ и пояснения не отдаются, пока учитель не разрешит: `reveal = after_submit` (сразу после сдачи) или `after_close` (после закрытия задания).

Жизненный цикл: `draft → published → closed → archived`. Закрытие досдаёт начатые попытки с уже сохранёнными ответами. Итог ученика: лучшая или последняя попытка (`score_policy`), это видно учителю в результатах.

| Метод | Путь | Кто | Назначение |
|---|---|---|---|
| GET/POST | `/organizations/{org}/assignments` | админ школы — все; учитель — задания для своих классов | создание черновика `{title, subject_id, question_count 1–40, class_ids, due_at?, max_attempts 1–10, score_policy, reveal}`; чужой класс даёт 404, срок в прошлом — 422 |
| GET/PUT | `/organizations/{org}/assignments/{id}` | автор, админ школы | PUT только для черновика |
| POST | `…/{id}/publish` | автор, админ школы | 409 `NOT_ENOUGH_QUESTIONS`, если опубликованных вопросов по предмету меньше нужного |
| POST | `…/{id}/close` · `/archive` | автор, админ школы | |
| GET | `…/{id}/results` | автор, админ школы, учитель класса | по ученикам: состояние, попытки, лучший/последний/итоговый балл; учитель видит только свои классы |
| GET | `/me/school-assignments` | ученик | задания его классов, `can_start`, итог только если разрешён показ |
| POST | `/school-assignments/{id}/attempts` | ученик класса | начать или продолжить попытку; 409 `NO_ATTEMPTS_LEFT`, `DUE_PASSED`, `ASSIGNMENT_CLOSED` |
| GET | `/school-assignments/attempts/{id}` | владелец попытки | вопросы без ключа; разбор после сдачи, если разрешён |
| POST | `…/attempts/{id}/answers` | владелец | `{question_id, selected_label}` → 204 без проверки в ответе; до сдачи ответ можно изменить; после срока 409 `DUE_PASSED` |
| POST | `…/attempts/{id}/finish` | владелец | сдать; допустимо и после срока |

Ученик, убранный из класса, теряет доступ к заданию (404); записанные попытки остаются.

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
