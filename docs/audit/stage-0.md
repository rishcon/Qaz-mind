# Этап 0 — аудит и baseline

Дата: 27.10.2026. Исходное состояние: React 19 + Vite 8 прототип без бэкенда, без git, с демо-логикой в браузере.

## 1. Baseline (до изменений)

| Проверка | Результат до этапа 0 | Результат после этапа 0 и этапов 1–3 |
|---|---|---|
| `npm install` | падал: ERESOLVE (`esbuild@0.25` против peer `vite@8`) | проходит, `package-lock.json` создан |
| `npm run lint` (`tsc --noEmit`) | **ошибка**: 3 ошибки импорта в `AuthModal.tsx` (мёртвый файл с телефонной регистрацией) | проходит |
| `npm run build` | проходит (JS 678 kB, предупреждение о размере чанка) | проходит (JS ~688 kB) |
| Тесты | 14/14 (`node --test`, без скрипта в `package.json`) | 24/24 (`npm test`) |
| Backend | не существовал | 31/31 (`pytest` на PostgreSQL 18, миграции совпадают с моделями) |

Уточнение к прежнему отчёту: `schoolService.test.ts` проходит, а не падает. Seed-массивы возвращаются как значения по умолчанию и мутируются в памяти модуля (`apps.unshift` меняет `SEED_APPLICATIONS`). Это работает случайно и не годится для повторяемых тестов; заменить на изолированное хранилище — задача этапа 6.

## 2. Реестр демонстрационной логики

Статус: **убрано** — удалено или выключено вне `DEMO_MODE`; **заменено** — перенесено на API; **осталось** — ждёт этапа, указанного в колонке.

| Место | Что | Статус |
|---|---|---|
| `App.tsx` (бывш. :203–263) | Вход по `qazmind_auth_user`, любой email создавал пользователя | заменено (этап 2), `AuthProvider` + `/auth/me` |
| `App.tsx` (бывш. :335–344) | Гейт только для `app`/`onboarding` | заменено: сессия нужна и для Focus-маршрутов |
| `App.tsx` (бывш. :104) | `?autostart=1` открывал кабинет без входа | убрано |
| `App.tsx` (бывш. :257–263) | Каждый новый браузер числился в 11 «А» Лицея №28 | убрано вне `DEMO_MODE` |
| `App.tsx` (бывш. :195) | Демо-список ошибок `sampleMistakes` в новом аккаунте | убрано (стартует пустым) |
| `App.tsx` (бывш. :226, 239–242) | `school_lyceum28`, учитель `usr_teacher_daulet` захардкожены | осталось для demo-экранов, этап 6 |
| `App.tsx` (бывш. :442–443, 476–477, 536–537) | Фолбэк `usr_student_aliyah` / `student@qazmind.kz` при записи результата | осталось, этап 6 |
| `App.tsx` (бывш. :496–498) | В разборе ошибок текст «Ошибочный ответ» / «Правильный ответ» вместо реальных ответов | осталось, этап 4–5 |
| `App.tsx` (бывш. :580–593) | `activeSchoolAssignment` не сбрасывался при выходе из Focus, личная практика уходила в школьное задание | **исправлено** (сброс при старте личных потоков) |
| `App.tsx` (бывш. :213–223) | `lastExamResult` не сохраняется: после F5 на `/exam/results` показывается 0/5 | осталось, этап 5 |
| `App.tsx` (бывш. :395–399) | Выход чистил только `qazmind_auth_user`, прогресс оставался для следующего пользователя | **исправлено**: ключи прогресса в пространстве пользователя, remount при смене аккаунта |
| `services/schoolService.ts` | Все школьные данные в localStorage, seed-организация, классы, коды, задания, результаты | осталось, этап 6–8 (только `DEMO_MODE`) |
| `services/schoolService.ts` (:468, :491, :542, :679) | `Math.random` для кодов, нет проверки `expiresAt`, лимит мест молча обрезается, upsert результата перезаписывает попытку | осталось, этап 7–8 |
| `services/schoolService.ts` (:724, :729, :731) | Фолбэк-цифры `84 / 28 / 82` | осталось, этап 10 (запрещено ТЗ п. 8) |
| `components/school/*`, `landing/SchoolSection.tsx`, `schools/SchoolLandingPage.tsx` | Захардкоженные «84% сдали», «24 из 28», «28 из 60», ученики Алия/Олжас | осталось, этап 6–10 |
| `content/questions.ts`, `content/subjectQuestions.ts` | Ключи ответов (`correctId`) в клиентском бандле | осталось, этап 5 (ТЗ п. 7.2) |
| `components/focus/FocusMockExamSession.tsx` | Пробник считается в браузере, таймер от `startTimestamp` в localStorage | осталось, этап 9 |
| `components/ExamPracticeSection.tsx` (:85–87) | 5 вопросов масштабируются до «из 140» | осталось, этап 9 (запрещено ТЗ п. 8.2) |
| `utils/scoring.ts` (:82–98) | 140 и банд «Грантовый уровень» зашиты в код | осталось, этап 9 |
| `content/curriculumData.ts` (:21–22) | `totalQuestions: 1420`, `totalTopics: 48` — выдуманные цифры | осталось, этап 4 |
| `components/focus/FocusLessonReader.tsx` (:21) | Неизвестный id урока подменяется уроком истории | осталось, этап 4 (ТЗ п. 6, сценарий F) |
| `components/focus/FocusPracticeSession.tsx` (:31, :33) | Пустой предмет подменяется вопросами другого предмета | осталось, этап 5 |
| `components/admin/PlatformAdminPage.tsx` (:46) | Одобрение школ без проверки прав | осталось, этап 6 (только `DEMO_MODE`) |
| `components/common/WorkspaceSwitcher.tsx` | Переключатель показывал все четыре пространства | **исправлено**: вне `DEMO_MODE` виден только личный кабинет |
| `components/auth/AuthModal.tsx` | Мёртвый файл с телефонной регистрацией и демо-входом «Алия» | **удалён** (ломал `lint`) |
| `public/assets/aistudio/Paste_*` | Внутренние промпты попадали в публичную сборку | **перенесены** в `docs/prompts/` |
| `schools/SchoolApplyPage.tsx` | Создание «подтверждённого» аккаунта в браузере | **убрано**: аккаунт создаётся только через `/register`; страница `/schools/apply` вне `DEMO_MODE` закрыта |
| `components/auth/VerifyEmailPage.tsx` | Подтверждение почты одним кликом | **заменено**: подтверждение по токену из ссылки |
| `components/auth/LoginPage.tsx` | Вход без проверки пароля | **заменено**: `POST /auth/login` |
| `components/auth/RegisterPage.tsx` | Имитация регистрации | **заменено**: `POST /auth/register` |
| `components/auth/ForgotPasswordPage.tsx` | Имитация отправки | **заменено**: `POST /auth/password/forgot`; добавлена страница `/reset-password` |
| `components/onboarding/OnboardingFlow.tsx` | Профиль сохранялся в localStorage | **заменено**: `POST /me/onboarding/complete` |
| `components/dashboard/SettingsView.tsx` | Сохранение только в localStorage, при этом показывался «успех» | **заменено**: сохраняются только поля сервера, ошибка показывается |
| `content/studentData.ts` | `initialDailyTasks` — демо-задачи «Сегодня» для нового пользователя | осталось, этап 4 |
| `App.tsx`, `OnboardingFlow` | Имя «Алия» по умолчанию в пути входа и онбординга | **убрано** |
| `docs/…` | Спецификация лежала в корне, а CLAUDE.md ссылался на `docs/` | **перенесена** в `docs/QAZMIND_TECHNICAL_SPEC.md` |

## 3. Карта маршрутов и риски доступа

| Путь | Экран | Было | Стало (вне `DEMO_MODE`) |
|---|---|---|---|
| `/` | лендинг | открыт | открыт |
| `/schools` | лендинг для школ | открыт | открыт |
| `/schools/apply` | заявка школы | открыт, создавал аккаунт локально | заглушка «откроется позже» |
| `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password` | аутентификация | имитация | API `/api/v1/auth/*` |
| `/onboarding` | настройка профиля | открыт при «входе» | нужна сессия; после онбординга сюда не пускает |
| `/app` и подразделы | личный кабинет | гейт по localStorage | нужна сессия и завершённый онбординг |
| `/learn/:subjectId/:lessonId` | Focus-урок | без гейта | нужна сессия и онбординг |
| `/practice/session/:subjectId` | Focus-практика | без гейта | нужна сессия и онбординг |
| `/exam/session/:id`, `/exam/results/:id` | Focus-пробник | без гейта | нужна сессия и онбординг |
| `/review/:id` | разбор ошибки | без гейта; после F5 открывает лендинг | нужна сессия и онбординг |
| `/school`, `/school/*` | кабинет школы | открыт, демо-данные | заглушка «раздел в разработке» |
| `/teacher`, `/teacher/*` | кабинет учителя | открыт, учитель захардкожен | заглушка |
| `/admin/schools` | админка платформы | открыта, одобряет школы | заглушка |

Открытые риски, которые остаются до соответствующих этапов: все школьные данные и результаты (этапы 6–8), контент и ключи ответов (этап 4–5), пробник и оценка из 140 (этап 9), аналитика (этап 10).

## 4. Итоговая схема localStorage

| Ключ | Назначение | Статус |
|---|---|---|
| `qazmind_auth_user`, `qazmind_onboarding`, `qazmind_profile`, `qazmind_pending_email` | личность и профиль | **удалены**; теперь сервер, для email на экране подтверждения — `sessionStorage` |
| `qazmind:<userId>:completed_lessons`, `:exam_history`, `:practiced_count`, `:mistakes`, `:student_class` | личный прогресс (черновой, до этапа 4) | перенесены в пространство пользователя |
| `qazmind_active_exam_session` | текущий пробник | осталось, этап 9 |
| `qazmind_schools`, `qazmind_school_applications`, `qazmind_school_members`, `qazmind_school_classes`, `qazmind_school_join_codes`, `qazmind_school_invitations`, `qazmind_school_assignments`, `qazmind_school_assignment_results` | школьные данные | осталось, этапы 6–8 (только `DEMO_MODE`) |

## 5. Что сделано в этапе 0

- Удалён мёртвый `AuthModal.tsx`; `npm run lint` снова проходит.
- Очищен `package.json`: удалены неиспользуемые `@google/genai`, `express`, `dotenv`, `esbuild`, `@types/express`; добавлен `npm test`; создан `package-lock.json`.
- `.gitignore` закрывает `node_modules`, `dist`, `.env*`, `.venv`, `.aistudio/`.
- `.env.example` содержит только публичные переменные фронтенда; ключ AI Studio убран.
- Спецификация перенесена в `docs/`, внутренние промпты — в `docs/prompts/`.
- Инициализирован git-репозиторий.
