# QAZMIND 2.0: COMPLETE UX/UI REFINEMENT AND PRODUCT FLOW REDESIGN

You are a senior product designer, UX architect, frontend engineer, and EdTech product specialist.

You are working on an EXISTING QazMind project.

**IMPORTANT: DO NOT GENERATE A NEW WEBSITE FROM SCRATCH.**

Analyze the existing application, its components, navigation, authentication, dashboard, learning pages, and interactions.

Your task is to significantly improve the existing QazMind platform, fix broken user journeys, simplify the interface, and transform the prototype into a coherent, realistic EdTech product.

Preserve the QazMind visual identity and existing useful components, but redesign workflows and screens wherever necessary.

All visible interface text must be in natural, concise Russian, with correct Kazakh localization support.

# 1. MAIN OBJECTIVE

QazMind is an online educational platform for students in Kazakhstan preparing for ЕНТ / ҰБТ.

I want a modern, beautiful, extremely intuitive learning application.

The user journey must be:

**Landing Page → Registration → Account Setup → Personal Dashboard → Learning → Practice → Mock Exam → Results and Progress.**

Every stage must be logically connected.

No random navigation.

No disconnected screens.

No fake functional buttons.

No unnecessary steps.

No generic AI-generated dashboard design.

The interface must feel like a carefully designed commercial educational product.

## Design philosophy

LESS TEXT.
LESS DECORATION.
LESS VISUAL NOISE.
MORE CLARITY.
MORE FUNCTIONALITY.
MORE LEARNING.

Do not add new features just to make the interface look complete.

Prioritize meaningful interactions and polished user experience.

---

# 2. FIX AUTHENTICATION COMPLETELY

The existing authentication experience needs a major redesign.

**Remove phone-number-based registration and login entirely.**

QazMind authentication must use email and password.

Remove phone formatting utilities, phone validation, phone-specific placeholders, and unnecessary phone fields.

## New registration page

Use a dedicated, beautiful registration page instead of a large overloaded modal.

Desktop:
- Clean, centered registration form
- QazMind wordmark
- Generous whitespace
- Subtle brand details
- No unnecessary illustrations
- Optional minimal secondary branding area

Mobile:
- Single-column layout
- Comfortable inputs
- No horizontal scrolling

### Registration form

Heading:

**«Создай аккаунт»**

Subtitle:

«Начни подготовку к ЕНТ.»

Fields:

1. Имя
2. Email
3. Пароль

Optional:
- Google sign-in, only if the provider is actually configured or clearly represented as a prototype

Primary button:

**«Зарегистрироваться»**

Below:

«Уже есть аккаунт? Войти»

Add:
- Show/hide password
- Email format validation
- Password length validation
- Clear inline error messages
- Loading button state
- Accessible field labels
- Link to terms and privacy policy

Do not ask for:
- Phone number
- Target score
- Profile subjects
- School
- City
- Exam language

Those learning preferences belong to onboarding AFTER registration.

Do not prefill any credentials.

Do not automatically accept terms of service.

### Email confirmation

Design an email verification screen:

Heading:

«Подтверди почту»

Text:

«Мы отправили письмо на example@gmail.com»

Actions:
- «Отправить повторно»
- «Изменить почту»

If a real authentication backend is not available, create the UI and clearly separate prototype behavior from actual verification.

Never pretend that a real email was sent when no email service exists.

## Login page

Heading:

**«С возвращением»**

Fields:
- Email
- Пароль

Actions:
- «Войти»
- «Забыли пароль?»
- «Создать аккаунт»

Remember session only when real session handling is supported.

Do not show fake prefilled credentials.

Create a proper password recovery screen.

### Authentication routing

Landing: /

Register: /register

Login: /login

Verify email: /verify-email

Forgot password: /forgot-password

Onboarding: /onboarding

Dashboard: /app

Unauthenticated users must not access private dashboard pages.

Returning authenticated users with completed onboarding must go directly to their dashboard.

New users must complete onboarding before entering their dashboard.

Do not automatically authenticate users just because they clicked a button.

---

# 3. CREATE A BEAUTIFUL POST-REGISTRATION ONBOARDING

This is one of the most important improvements.

After successful registration and applicable email verification, do NOT open the dashboard immediately.

Open a dedicated onboarding flow.

No sidebar.

No dashboard navigation.

No marketing header.

Only the QazMind logo, step progress, onboarding content, and navigation buttons.

Keep the whole experience minimal, focused, welcoming, and fast.

The onboarding should have 4 main steps.

## STEP 1: Language

Heading:

**«На каком языке будешь учиться?»**

Two large selectable options:

- Қазақша
- Русский

Explain briefly that the user can change the language later.

Allow selecting the interface language and the ЕНТ testing language separately if necessary.

Selected option:
- Subtle border emphasis
- Small check indicator
- Clear visual state

Do not overdesign with huge illustrated cards.

Button:

«Продолжить»

## STEP 2: Profile subjects

Heading:

**«Выбери профильные предметы»**

Subtitle:

«Какие два предмета ты сдаёшь на ЕНТ?»

Show valid official ЕНТ profile subject combinations.

Examples:

- Математика + Физика
- Биология + Химия
- Математика + География
- Всемирная история + География
- Другие официально допустимые комбинации

Use a complete configurable list of valid combinations.

Do not allow arbitrary incompatible combinations.

Make selection extremely easy.

Use a searchable single-choice list if necessary.

Show a small confirmation:

«Твои профильные предметы: Математика и Физика»

Important:

The three mandatory subjects must be automatically included in the student's learning program.

Do not ask the student to select mandatory subjects.

They are automatically added according to the relevant ЕНТ format.

Button:

«Продолжить»

## STEP 3: Target score

Heading:

**«Сколько баллов хочешь набрать?»**

Make this screen visually distinctive but minimal.

Display a beautiful large number:

**140 / 140**

Let the student choose a realistic target score up to 140.

Use:
- Slider
- Editable numeric value
- Clear maximum limit
- Simple interaction

Example supporting text:

«К этой цели будем двигаться вместе.»

Do not use overly motivational paragraphs.

The selected target is a goal, not an achieved score or prediction.

Do not automatically award any progress.

Save the selected number in the student profile.

Button:

«Продолжить»

## STEP 4: Study preferences

Heading:

**«Настроим твой план»**

Ask only what genuinely helps prepare the schedule.

Fields:

1. When are you planning to take ЕНТ?

Allow selecting a year and approximate exam period or an exact date if known.

2. How much time can you study daily?

Options:
- 15 минут
- 30 минут
- 45 минут
- 60 минут
- Свой вариант

These settings should be editable later.

Do not make an unknown exact exam date mandatory.

Button:

**«Начать обучение»**

## Onboarding completion

On completion:

1. Save the user's preferences.
2. Create a personalized learning configuration.
3. Add mandatory and selected profile subjects.
4. Initialize an empty learning progress state.
5. Generate a sensible first learning recommendation.
6. Navigate to the new-user dashboard.

Important:

A new student must have zero completed lessons, zero exam history, and no fictional scores.

Offer an optional short diagnostic test.

If the student skips diagnostics, allow starting the first lesson.

Do not invent a personalized mastery profile without real assessment data.

### Onboarding navigation

- Back button
- Step indicator
- Continue button
- Saved step selections
- Proper validation
- Responsive layout

Returning users with unfinished onboarding must resume from the appropriate step.

Never force returning users to repeat completed onboarding.

---

# 4. REDESIGN THE PERSONAL DASHBOARD

The current dashboard contains too much information and explanatory text.

Simplify it significantly.

**The dashboard should be a daily starting point, not an analytics report.**

Students should immediately see what to do next.

## Visual direction

Preserve QazMind colors:

Background: #F5F3EE

Text: #171717

Accent: #FF5A36

Borders: #E2DED5

Reduce:
- Heavy black shadows
- Thick borders
- Excessive uppercase labels
- Repeated orange section headers
- Decorative progress cards
- Overly long descriptions
- Unnecessary motivational text
- Oversized section titles

Use:
- Beautiful typography
- Balanced composition
- Subtle dividers
- Restrained orange accents
- Comfortable whitespace
- A clear visual hierarchy

Do not wrap every element in a separate card.

## New dashboard structure

### Header

«Привет, Алия»

Smaller contextual text:

«Продолжим подготовку?»

No giant paragraph.

### Main section

The most important element:

**«Продолжить обучение»**

Show:
- Subject
- Lesson title
- Lesson progress
- Estimated remaining duration

Primary button:

«Продолжить»

For a new user:

Show:

«Начни с первого урока»

Primary:
«Начать обучение»

Secondary:
«Пройти диагностику»

### Daily plan

Heading:

«Сегодня»

Display 2–3 activities.

Example:

01. История Казахстана
Изучить тему
8 мин.

02. Математика
Решить 5 вопросов
7 мин.

03. Повторение
Разобрать ошибки
5 вопросов.

Every task must be clickable.

Avoid lengthy descriptions.

### Compact progress

Show only genuinely useful information:

- Моя цель: 140
- Изучено тем: 0
- Повторить: 0

For new students, show empty or zero states.

Do not fabricate exam results.

Move detailed analytics to the dedicated Progress page.

### Dashboard personalization

The displayed subjects and recommendations must depend on the student's onboarding selections.

If a student selected Biology + Chemistry, do not show Mathematics + Physics as their profile subjects.

If the user changes their subjects in settings, update all relevant screens.

Do not mix the demonstration student profile with real user state.

---

# 5. REDESIGN NAVIGATION AND APPLICATION LAYOUTS

Create THREE clearly separated application layouts.

This is a mandatory architectural change.

## Layout A: Public Layout

Used for:
- Landing page
- Public information
- Pricing

Contains:
- Marketing navigation
- Landing page sections
- Footer

## Layout B: Dashboard Layout

Used for:
- Сегодня
- Мой маршрут
- Предметы
- Практика setup
- Пробное ЕНТ setup
- Мои ошибки
- Прогресс
- Настройки

Contains:
- Application sidebar on desktop
- Compact application header
- Main content
- Mobile bottom navigation

## Layout C: Focus Mode Layout

Used for ACTIVE learning sessions.

This is extremely important.

When the student starts an actual activity, the entire normal dashboard layout must disappear.

**NO SIDEBAR.**

**NO DASHBOARD HEADER.**

**NO MAIN NAVIGATION.**

**NO MARKETING ELEMENTS.**

The learning or examination interface should occupy the entire browser viewport.

This must be a separate full-page experience, not a modal over the dashboard.

Do not merely dim or overlay the existing sidebar.

Switch to a dedicated Focus Mode layout.

Browser fullscreen permission is not required. Use the complete browser viewport with an immersive application layout.

---

# 6. FULLSCREEN MOCK EXAM EXPERIENCE

This is a high-priority requirement.

The current mock exam is shown inside the dashboard layout.

That is not the experience I want.

## Step A: Mock Exam Overview

User clicks:

«Пробное ЕНТ»

From sidebar.

The dashboard layout remains visible.

Show a minimal overview screen.

Heading:

**«Пробное ЕНТ»**

Brief details:
- Subjects
- Number of questions
- Duration
- Available attempts or previous results, if applicable

One prominent button:

**«Начать экзамен»**

Do not create a wall of instructional text.

Use a short expandable «Правила экзамена» section for detailed instructions.

## Step B: Start Exam

User clicks:

«Начать экзамен»

Open a NEW FULLSCREEN EXAM INTERFACE.

Hide the sidebar completely.

Hide dashboard navigation completely.

Do not show dashboard widgets or learning recommendations.

### Fullscreen Exam Layout

Top header:

Left:
- qazmind.
- «Пробное ЕНТ»

Center:
- Current subject

Right:
- Timer
- «Завершить»

Main area:

Large, readable question text.

Answer options directly below.

Question progress:

«Вопрос 12 из 120»

Right side on desktop:

Compact question navigator:
- Answered
- Not answered
- Marked for review

Bottom:
- «Назад»
- «Далее»

Make question navigation clear and consistent.

Use a subtle fixed or sticky bottom navigation area.

Avoid large, decorative cards.

The exam interface must be calm, professional, and distraction-free.

### Exam functionality

Allow:
- Select answer
- Change answer
- Skip a question
- Mark for review
- Jump to another question
- View remaining time
- See answered/unanswered status
- Review before submission
- Submit the exam

For questions allowing multiple answers or matching, use the appropriate interaction type.

Implement question rendering through reusable components supporting the actual exam question formats.

Do not treat every question as single-choice.

### Exit behavior

If the user tries to leave:

Open a confirmation dialog:

«Выйти из экзамена?»

Explain clearly whether the current attempt is saved and can be resumed.

Options:
- «Продолжить экзамен»
- «Выйти»

Do not accidentally erase answers.

Define and implement consistent session persistence behavior.

For a saved timed attempt, the timer must be based on actual remaining time rather than resetting whenever the page reloads.

At expiry, show the appropriate submission result rather than silently resetting.

### Important exam logic correction

The existing prototype uses a tiny demonstration question bank and converts its result into an artificial score out of 140.

REMOVE THIS MISLEADING SCORING BEHAVIOR.

Do not scale five demo questions into a claimed official 140-point exam score.

Until a complete verified exam question bank and correct scoring rules exist:

- Clearly label the existing five-question flow as a demonstration.
- Show the result as the actual number correct out of five.
- Do not call it a full official-style 120-question exam.
- Do not run a four-hour countdown for a five-question demo.

Create the complete 120-question exam UI and scoring architecture as a future-ready structure, but do not fabricate missing questions.

The official exam mode should be enabled only when a complete, verified question set is available.

## Step C: Exam Results

After the exam ends:

Show a dedicated results screen in Focus Mode.

No dashboard sidebar.

For valid full exam attempts:
- Actual total score
- Maximum score
- Results by subject
- Correct answers
- Incorrect answers
- Unanswered questions
- Topics requiring review

For short demo attempts:
- Actual raw demo result
- Clear demonstration label

Buttons:
- «Разобрать ошибки»
- «Вернуться в кабинет»

Do not display fake graphs.

Do not show target achievement claims without valid data.

---

# 7. FULLSCREEN PRACTICE EXPERIENCE

Apply the same concept to regular practice.

## Step A: Practice Setup

User opens:

«Практика»

Inside the regular dashboard layout.

Show a minimal practice configuration screen.

Heading:

«Практика»

Controls:

- Mode
- Subject
- Topic
- Number of questions

One main CTA:

**«Начать практику»**

Avoid lengthy explanations beneath every option.

Use progressive disclosure.

Only show relevant controls based on the selected mode.

## Step B: Active Practice

After clicking «Начать практику»:

Switch to FULLSCREEN FOCUS MODE.

Hide sidebar and dashboard navigation.

Show:

Top:
- Subject / Topic
- Question progress
- Exit

Center:
- Question
- Answer options

Bottom:
- «Проверить»
- «Следующий вопрос»

After submitting:

Show concise feedback:
- Correct / Incorrect
- Short explanation
- Link to relevant lesson if helpful

No intrusive AI chat by default.

AI assistance should only open when requested.

### Important data logic

Practice questions must actually match the selected subject, topic, and mode.

Do not reuse History of Kazakhstan questions for Mathematics practice.

If no questions exist for a selected topic, show an honest empty state.

Do not fabricate missing content.

## Step C: Practice Results

Show:

«Практика завершена»

- Correct answers
- Mistakes
- Topics to repeat

Actions:
- «Разобрать ошибки»
- «Повторить»
- «В кабинет»

Keep the result screen compact and useful.

---

# 8. FULLSCREEN LESSON READER

A student should be able to concentrate when studying.

The existing lesson reader should also support Focus Mode.

## Entry flow

Dashboard or Subjects page:

User clicks a specific lesson.

Open the selected lesson in a dedicated fullscreen learning environment.

Do not open a generic lesson for every subject.

Example route:

/learn/history-kz/khanate-foundation

## Lesson layout

No application sidebar.

No regular dashboard top navigation.

Top minimal bar:

Left:
- Back arrow
- Subject name

Center:
- Lesson title or current step

Right:
- Lesson progress
- Optional outline button

Main content:

A beautifully designed reading area approximately 680–760px wide on desktop.

Use exceptional typography and comfortable line spacing.

Keep all educational content centered and readable.

Avoid unnecessary cards around paragraphs.

### Lesson content

Include:
- Lesson title
- Small introduction
- Educational text
- Important concept
- Example
- Short interactive question
- Conclusion

Use a clear learning structure.

Do not create huge text-heavy pages.

Break longer lessons into meaningful steps when appropriate.

### Lesson navigation

Bottom navigation:
- «Назад»
- «Далее»

Last step:
- «Завершить урок»

On completion:
- Save lesson completion
- Update subject progress
- Offer related practice

Do not mark a lesson complete simply because it was opened.

### Lesson exit

Allow leaving the lesson.

Save reading progress.

When reopening, resume from the last meaningful step.

Use an unobtrusive confirmation only when leaving would discard unsaved input.

---

# 9. REDESIGN SUBJECT NAVIGATION

The existing subject navigation must become dynamic.

The student's selected onboarding subjects should determine their learning program.

## Subjects overview

Show the three mandatory subjects and two profile subjects.

For each:
- Subject title
- Actual progress
- Continue action

Keep the design simple.

Use elegant list rows or restrained subject panels.

Do not use large colorful cards.

## Subject page

When a subject is clicked:

Open that subject's own syllabus.

Show:
- Subject title
- Relevant chapters
- Lesson list
- Completion status

Clicking a particular lesson must open THAT lesson, not a shared hardcoded lesson.

Use stable subject IDs, topic IDs, and lesson IDs.

Do not navigate by title strings.

A History lesson must not appear under Physics.

A Physics practice session must not display History questions.

Use data-driven routing.

If real content is missing, show an appropriate unavailable state rather than a misleading substitute.

---

# 10. IMPROVE MISTAKES AND PROGRESS

## My Mistakes

Current page: «Мои ошибки»

Simplify it.

Show errors grouped by subject and topic.

Each row should contain:
- Question or short title
- Subject
- Error status
- Action «Разобрать»

On clicking «Разобрать»:

Open a dedicated focused review screen.

No sidebar.

Show the original question, student's answer, correct answer, explanation, and retry option.

Returning to the mistakes list must preserve filters.

Mark a question as mastered only after meaningful successful revision, not merely after opening it.

## My Progress

Use only real student data.

Display:
- Completed lessons
- Practiced questions
- Results over time
- Areas requiring review

Do not invent test scores or engagement statistics.

If a new student has no data:

Show:

«Пока нет результатов»

Supporting text:

«Пройди первый урок или тест, чтобы увидеть прогресс.»

One button:

«Начать обучение»

Avoid large empty charts.

For valid mock exam history, show actual score trends.

---

# 11. SIMPLIFY ALL TEXT AND MICROCOPY

The current interface contains too much explanatory text.

This needs a systematic rewrite.

Reduce unnecessary visible text by approximately 40–50% where possible, without removing important instructions, accessibility labels, exam rules, or safety-critical information.

### Rules

1. Prefer short headings.
2. Limit standard supporting text to one short sentence.
3. Remove repetitive explanations.
4. Avoid exaggerated motivational language.
5. Avoid unnecessary uppercase labels.
6. Use concise button labels.
7. Do not repeat information already visible in the interface.
8. Move secondary details into expandable sections or contextual help.
9. Keep legal, validation, and important exam information accessible.
10. Write natural Russian, not literal AI-style marketing copy.

Examples:

Instead of:

«Добро пожаловать в вашу персонализированную образовательную среду, где вы сможете отслеживать индивидуальные показатели эффективности подготовки...»

Use:

**«Продолжим подготовку?»**

Instead of:

«Выберите подходящий формат тренировочного процесса для эффективного закрепления полученных знаний»

Use:

**«Выбери формат практики»**

Instead of:

«Пожалуйста, выберите интересующий вас учебный предмет для дальнейшего прохождения образовательной программы»

Use:

**«Выбери предмет»**

Instead of:

«Осуществить переход к следующему тренировочному заданию»

Use:

**«Далее»**

The product should communicate quickly and confidently.

---

# 12. REFINE VISUAL DESIGN

Keep the existing identity but refine its execution.

The current design relies too heavily on:
- Thick black borders
- Large offset shadows
- All-caps micro labels
- Repetitive editorial components
- Too many separate containers
- Oversized typography in application pages

Reduce these elements.

### Visual rules

Use subtle 1px borders.

Remove heavy black shadows from ordinary application components.

Use more whitespace instead of more boxes.

Keep the large editorial typography primarily on the landing page.

Use calmer typography inside the student dashboard.

Use orange mostly for primary actions and active states.

Avoid decorative orange labels above every heading.

Use consistent field heights and button sizes.

Maintain good contrast and accessibility.

The interface should feel premium and polished.

**Not brutalist for the sake of being brutalist.**

Not generic SaaS.

Not an admin panel.

Not a children's application.

The goal is an excellent contemporary EdTech interface.

---

# 13. MOBILE EXPERIENCE

Redesign the mobile version intentionally.

Desktop sidebar must not remain visible during active learning.

For ordinary dashboard navigation, use compact bottom navigation:

- Сегодня
- Учёба
- Практика
- Прогресс
- Профиль

For active lessons, practice, exams, and mistake review:

Remove the bottom navigation.

Use Focus Mode.

Provide:
- Compact top bar
- Reading content
- Large selectable answers
- Sticky bottom action area
- Easy question navigation
- Exit control

Question navigation on mobile may open a sheet.

Avoid cramped exam grids.

Avoid horizontal overflow.

Ensure comfortable touch targets.

The experience should feel close to a dedicated mobile learning app.

---

# 14. APPLICATION STATE AND PERSISTENCE

Refactor the application state.

The current prototype relies too heavily on hardcoded returning-student data.

Separate:

1. Authentication state
2. User profile
3. Onboarding state
4. Selected subjects
5. Learning progress
6. Practice sessions
7. Mock exam sessions
8. Mistake history
9. Application navigation

On application launch:

If not authenticated:
Show landing or login.

If authenticated but onboarding incomplete:
Show onboarding.

If authenticated and onboarding complete:
Show dashboard.

Never open the returning student's dashboard by default for an unauthenticated visitor.

Remove the floating quick-access button that bypasses authentication and opens the student workspace.

If developer demo access is needed, keep it clearly separated from the normal production experience.

### Persistence

For the frontend prototype, localStorage may be used for non-sensitive demonstration preferences, onboarding state, and mock learning progress.

Do not store passwords or authentication secrets in localStorage.

A local demo state must not be presented as secure production authentication.

For a real production deployment, use backend-managed accounts, secure sessions, user-scoped progress data, and reliable persistence.

On refresh:
- Preserve selected onboarding preferences.
- Preserve applicable completed lesson progress.
- Preserve saved practice session state.
- Preserve resumable exam state.
- Do not reset the application to fictional student data.

Changing the interface language must not erase progress.

Changing target score must not erase progress.

---

# 15. FIX EXISTING TECHNICAL PROBLEMS

Review the current codebase, especially the existing:

- App.tsx
- AuthModal.tsx
- DashboardShell.tsx
- TodayView.tsx
- SubjectsView.tsx
- LessonReaderView.tsx
- PracticeView.tsx
- MockExamView.tsx
- ProgressView.tsx
- SettingsView.tsx
- studentData.ts
- questions.ts
- scoring.ts

Refactor existing code where appropriate.

Do not blindly rewrite the entire application.

Specific corrections:

1. Remove phone-based authentication.
2. Remove prefilled fake login information.
3. Stop automatically opening the returning-student workspace.
4. Add onboarding before dashboard access.
5. Store the chosen target score and profile subjects.
6. Make subject navigation dynamic.
7. Make lesson navigation ID-based.
8. Make practice questions depend on selected subject and topic.
9. Remove fake 140-point score scaling from short demo tests.
10. Separate dashboard layout from Focus Mode layout.
11. Preserve session state correctly.
12. Update outdated hardcoded exam dates.
13. Remove fictional achievements for new users.
14. Fix nonfunctional or misleading buttons.
15. Eliminate duplicated interface patterns.

Use reusable components and predictable data structures.

If React Router is appropriate, introduce proper routes and layout separation.

Ensure direct page links, refresh behavior, and browser Back navigation work correctly.

---

# 16. REQUIRED PAGE STRUCTURE

Implement the following logical routes or equivalent routing architecture.

PUBLIC:

/
 /login
 /register
 /verify-email
 /forgot-password

ONBOARDING:

/onboarding

DASHBOARD:

/app
/app/route
/app/subjects
/app/subjects/:subjectId
/app/practice
/app/mock-exam
/app/mistakes
/app/progress
/app/settings

FOCUS MODE:

/learn/:subjectId/:lessonId
/practice/session/:sessionId
/exam/session/:attemptId
/review/:questionId

RESULTS:

/practice/results/:sessionId
/exam/results/:attemptId

The exact technical implementation may be adapted to the current project, but the separation of ordinary pages and active fullscreen workflows is mandatory.

---

# 17. REQUIRED USER JOURNEYS

Make these complete journeys functional in the prototype.

## Journey 1: New student

Landing
→ Register with email
→ Applicable verification
→ Select language
→ Select profile subjects
→ Select target score (140)
→ Set study preferences
→ New-user dashboard
→ Start first lesson
→ Complete lesson
→ View updated progress

## Journey 2: Returning student

Login
→ Dashboard
→ Continue unfinished lesson
→ Focus Mode lesson
→ Finish lesson
→ Return to dashboard

## Journey 3: Practice

Dashboard
→ Practice
→ Select subject and topic
→ Start practice
→ Fullscreen practice
→ Answer questions
→ Results
→ Review mistakes
→ Dashboard

## Journey 4: Mock exam

Dashboard
→ Mock exam
→ Exam overview
→ Start exam
→ Fullscreen examination
→ Answer and navigate
→ Finish confirmation
→ Results
→ Dashboard

## Journey 5: Change subjects

Dashboard
→ Settings
→ Change profile subjects
→ Save
→ Subjects list updates
→ Recommendations update

Do not silently erase previously completed learning history when preferences change.

## Journey 6: Resume interrupted session

Start lesson or practice
→ Make progress
→ Refresh browser
→ Restore saved state
→ Continue from the relevant position

For a timed exam, restoring the attempt must not restart the timer.

---

# 18. INTERACTION AND UX QUALITY REQUIREMENTS

All major actions must have meaningful outcomes.

Examples:

- Clicking Continue opens the actual selected lesson.
- Clicking a subject opens the correct syllabus.
- Clicking Start Practice opens a fullscreen practice session.
- Clicking Start Exam opens a fullscreen examination interface.
- Clicking Next moves to the next question.
- Clicking Finish opens a confirmation.
- Submitting an exam opens its result.
- Changing a target updates relevant displays.
- Completing a lesson updates progress.
- Logging out returns to the public authentication state.

Design loading, empty, validation-error, success, and unavailable states where necessary.

Use keyboard navigation and accessible focus indicators.

Do not create visual buttons that have no behavior.

Do not display false success messages.

If a backend feature is unavailable, provide an honest prototype state rather than pretending to perform a real external operation.

---

# 19. QUALITY CHECK AND ACCEPTANCE TESTS

Before completing the redesign, verify the following:

[ ] A visitor cannot access the private dashboard without authentication.

[ ] Registration uses email rather than phone.

[ ] Target score and profile subjects are selected AFTER registration.

[ ] A new user cannot bypass onboarding accidentally.

[ ] A new user does not inherit the demo student's results.

[ ] Onboarding choices appear correctly in the dashboard.

[ ] The student's selected subject combination is respected.

[ ] Clicking a lesson opens the correct lesson.

[ ] Starting practice removes the dashboard sidebar.

[ ] Starting a mock exam removes the dashboard sidebar.

[ ] Opening a lesson in Focus Mode removes the dashboard sidebar.

[ ] The active exam has clear question navigation and a timer.

[ ] Exiting an activity handles unsaved or resumable work safely.

[ ] The five-question demo never reports a misleading official 140-point result.

[ ] Completed work updates the relevant progress state.

[ ] The interface language can change without resetting data.

[ ] There are no outdated hardcoded year labels.

[ ] Mobile learning interfaces are usable without dashboard chrome.

[ ] No primary action is decorative or nonfunctional.

[ ] The website has significantly less unnecessary text.

[ ] The interface maintains a consistent brand identity.

---

# 20. EXECUTION PRIORITY

Do not spend effort redesigning the already existing landing page.

Preserve its general visual identity.

Focus on improving the actual product.

Implement in this priority order:

PHASE 1:
Authentication and onboarding.

PHASE 2:
Student dashboard and navigation architecture.

PHASE 3:
Fullscreen lesson, practice, and examination experiences.

PHASE 4:
Dynamic subjects, real progress connections, mistakes, and results.

PHASE 5:
Visual cleanup, mobile refinement, accessibility, and interaction testing.

Do not sacrifice functional correctness for visual decoration.

Do not replace existing working screens with static mockups.

Do not remove established features unless they are redundant, misleading, or broken.

# FINAL PRODUCT DIRECTION

QazMind should feel like a serious, modern, beautifully designed EdTech platform.

Registration should take seconds.

Onboarding should feel effortless.

The dashboard should immediately show what to study.

Lessons should feel like reading a beautifully designed digital textbook.

Practice should feel focused and fast.

Mock examinations should feel like a proper examination environment.

Results should be accurate and useful.

Every screen must have a clear purpose.

**The goal is not to create more UI. The goal is to create a better learning experience.**

Transform the existing QazMind prototype into a coherent, polished, minimal, realistic educational application that students would genuinely enjoy using every day.