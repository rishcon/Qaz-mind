# QAZMIND 3.0 — SCHOOL PLATFORM EXPANSION

## EXISTING APPLICATION EXTENSION, NOT A NEW PROJECT

You are a senior full-stack engineer, SaaS architect, EdTech product designer, and UX specialist.

You are working inside an EXISTING QazMind application.

QazMind is a modern online educational platform for preparing students in Kazakhstan for ЕНТ / ҰБТ.

The application already includes a landing page, email authentication interfaces, student onboarding, a personal learning dashboard, subjects, lessons, practice, mock exams, progress tracking, and dedicated fullscreen learning experiences.

Your task is to EXPAND the existing application with a complete school and teacher ecosystem.

**CRITICAL: DO NOT REBUILD THE APPLICATION FROM SCRATCH.**

First, inspect the entire existing project and understand its structure, routing, state management, components, authentication, persistence, learning engine, and visual identity.

Reuse and extend existing functionality.

Preserve the current student experience.

Do not replace working application pages with static prototypes.

Do not remove or break previously implemented features.

Build this as a coherent extension of the same QazMind product.

---

# 1. PRODUCT VISION

QazMind must support two primary usage models:

**QazMind Personal**

For individual students preparing independently for ЕНТ.

**QazMind Schools**

For schools, teachers, and educational institutions that want to organize and monitor ЕНТ preparation.

Both models must share the same educational content, testing system, learning engine, and user account infrastructure.

Do not create two disconnected applications.

A student must be able to study independently and belong to a school simultaneously.

A teacher must be able to manage assigned classes.

A school administrator must be able to manage teachers, students, classes, invitations, and institutional learning results.

Create a professional multi-role EdTech SaaS architecture.

The platform must feel like a real educational product used by institutions, not a decorative school dashboard.

---

# 2. PRESERVE THE EXISTING DESIGN IDENTITY

Keep QazMind's current visual identity.

Brand:

qazmind.

Colors:
- Background: #F5F3EE
- Text: #171717
- Accent: #FF5A36
- Surfaces: #FFFFFF
- Borders: #E2DED5

Maintain the existing typography and component system wherever appropriate.

However, school and teacher interfaces should be slightly more restrained and information-focused than the public landing page.

Use:
- Clean tables
- Well-structured lists
- Compact metrics
- Precise spacing
- Subtle borders
- Clear hierarchy
- Good typography
- Minimal icons

Avoid:
- Generic AI dashboard layouts
- Excessive cards
- Huge shadows
- Unnecessary illustrations
- Decorative graphs
- Overly large headings
- Walls of explanatory text
- Random gradients
- Fake business metrics

The school interface should look like professional software, not a landing page.

Think:

**Modern educational workspace + excellent SaaS usability + distinctive QazMind identity.**

All visible interface copy must be concise and natural Russian.

Support Kazakh localization with correct Kazakh characters.

---

# 3. UPDATE THE PUBLIC LANDING PAGE

The existing landing page currently focuses on individual students.

Extend it to communicate that QazMind also works for schools.

Do not completely redesign the landing page.

Preserve the current visual composition and brand identity.

## Header

Add a new navigation item:

**«Школам»**

Suggested navigation:

- Возможности
- Как это работает
- Школам
- Тарифы

Right:
- RU / KZ
- Войти
- Начать бесплатно

The “Школам” item must open a dedicated school landing page.

Route:

/schools

## Add a school section to the main landing page

Create an elegant section:

Small label:

ДЛЯ ШКОЛ

Heading:

**«Готовьте к ЕНТ целые классы.»**

Short supporting text:

«Подключайте учеников, назначайте задания и отслеживайте результаты в одном месте.»

Show a realistic preview of the future school interface.

The preview should contain:
- School name
- Class list
- Assigned tests
- Completion status
- Brief results overview

Do not use fake student achievements or invented real school logos.

Use clearly illustrative data.

Primary CTA:

**«QazMind для школ»**

This opens /schools.

The new section must blend naturally into the existing landing page.

Do not make the landing page excessively long.

---

# 4. CREATE A DEDICATED SCHOOL LANDING PAGE

Route:

/schools

This page is a part of QazMind, not a separate brand.

Use the same header, logo, typography, and colors.

The school landing page should be elegant, concise, credible, and conversion-focused.

## Hero

Small label:

QAZMIND FOR SCHOOLS

Main heading:

**«Подготовка к ЕНТ под контролем школы.»**

Supporting text:

«Объедините учеников и учителей в одной платформе. Назначайте задания, отслеживайте подготовку и находите темы, требующие внимания.»

Primary CTA:

**«Подключить школу»**

Secondary CTA:

«Посмотреть возможности»

Do not show fabricated partner school counts.

## Product showcase

Display an actual high-fidelity preview of the school workspace.

Include:
- Classes
- Students
- Teachers
- Assigned activities
- Assignment completion
- Subject performance

The preview must match the real interface implemented in the application.

## Three key benefits

01. Подключайте учеников

Create classes and invite students using email invitations or class codes.

02. Управляйте подготовкой

Teachers assign lessons, practice tasks, and available tests.

03. Анализируйте результаты

Understand completion rates, performance by topic, and areas requiring additional attention.

Use varied, elegant section layouts.

Avoid three identical giant marketing cards.

## How Schools Get Started

Show a short process:

1. Отправьте заявку
2. Подтвердите школу
3. Создайте классы
4. Пригласите учеников
5. Начните подготовку

## School pricing

Do not invent actual pricing.

Show:

**QazMind Schools**

«Стоимость зависит от количества учеников.»

CTA:

«Обсудить подключение»

If pricing and billing are not configured, this must open the school application flow, not a fake payment interface.

## FAQ

Short questions:
- Как подключить школу?
- Как пригласить учеников?
- Нужны ли ученикам отдельные аккаунты?
- Можно ли использовать существующий аккаунт?
- Что видит учитель?
- Как защищены данные учеников?

Avoid unnecessary text.

---

# 5. REDESIGN REGISTRATION TO SUPPORT ACCOUNT TYPES

This is a high-priority requirement.

The existing student registration and login functionality must continue working.

Add a clear distinction between registering as an individual student and registering a school organization.

## Registration entry point

When someone clicks “Зарегистрироваться” on the public website, show an elegant role selection screen.

Heading:

**«Как будешь использовать QazMind?»**

Two options:

### Option 1

**«Я ученик»**

«Хочу готовиться к ЕНТ самостоятельно.»

Action:

«Продолжить»

### Option 2

**«Я представляю школу»**

«Хочу подключить учеников и учителей.»

Action:

«Подключить школу»

Use two minimal selectable surfaces with clear descriptions.

Do not create huge illustrations.

Important:

Teachers must NOT need to register a new school to join an existing organization.

Teacher accounts are primarily created or linked through secure invitations.

## Student registration

Continue using the existing email-based student registration.

Fields:
- Имя
- Email
- Пароль

After authentication and applicable email verification:

Continue the existing student onboarding:
- Language
- Profile subjects
- Target score
- Study preferences

Then open the student dashboard.

Do not modify or break this flow.

## School registration

Clicking “Подключить школу” opens a separate school application process.

Route:

/schools/apply

Do not register the representative as a student.

Use the same shared user identity system.

Step 1: Representative account

Fields:
- Name
- Email
- Password

Existing users may sign in instead.

Step 2: School information

Fields:
- Название школы
- Город / населённый пункт
- Тип организации
- Контактный email
- Контактное лицо

Optional:
- Approximate number of students to connect

Do not demand unnecessary personal information.

Step 3: Submit application

Show confirmation:

**«Заявка отправлена»**

Supporting text:

«Сообщим о результате проверки.»

Application status:

Pending Verification

A school representative must NOT automatically receive unrestricted administrator access to a verified school.

Create an approval workflow.

An authorized QazMind platform administrator must be able to approve or reject applications.

After approval, the representative can activate and configure the school workspace.

If no real backend or mail service exists, show an honest demo flow. Never falsely claim that a real application was submitted or verified.

---

# 6. UNIFIED AUTHENTICATION AND ROLE-BASED ACCESS

Implement one shared authentication system.

Do not create separate login databases for students, teachers, and school administrators.

Every user has one account.

A user may have:
- A personal student profile
- Membership in one or more school organizations
- One or more organization-specific roles

Roles:

STUDENT

TEACHER

SCHOOL_ADMIN

PLATFORM_ADMIN

Do not use one mutable global role string as the sole authorization mechanism.

Roles should be associated with organization memberships.

A teacher can potentially belong to multiple institutions.

A user can have a student account independently of school membership.

## Login behavior

Use one common login page:

/login

After successful authentication:

Individual student:
→ /app

School administrator:
→ /school

Teacher:
→ /teacher

A user with multiple contexts:
→ Restore the previously selected authorized workspace or show a simple workspace selector.

Do not redirect based only on a role stored in localStorage.

Access must be verified against the authenticated user's actual memberships.

## Workspace switching

If the user has access to multiple workspaces, provide a compact workspace switcher.

Example:

qazmind.

Мои пространства

- Личное обучение
- Школа №25

Only show available, authorized workspaces.

Do not show school controls to ordinary students.

Do not show platform administration to school administrators.

---

# 7. SCHOOL ADMINISTRATOR DASHBOARD

Create a completely new workspace:

/school

This must be a proper school administration interface.

Use the existing design language but build a school-specific navigation structure.

## Desktop sidebar

Logo:

qazmind.

Below the logo:

Current school name.

Navigation:
- Обзор
- Классы
- Ученики
- Учителя
- Задания
- Аналитика
- Приглашения
- Доступы
- Настройки

At the bottom:
- Help
- Account profile
- Workspace switcher if applicable

Do not put individual student study features inside the school administration sidebar.

## School Dashboard

Heading:

**«Обзор школы»**

Subheading:

School name.

Show only meaningful, real or properly marked demonstration metrics.

Suggested metrics:
- Total active students
- Total teachers
- Active classes
- Assignment completion rate

Below:

### Classes

Simple list:

11 «А»
11 «Б»
11 «В»

Each item shows:
- Number of students
- Assigned teachers
- Current active assignments

### Recent assignments

Show:
- Assignment title
- Assigned class
- Due date
- Completion status

### Attention required

Highlight:
- Pending invitations
- Expired access
- Classes without teachers
- Overdue assignments

Avoid overwhelming the interface.

Use compact rows and lists.

The school administrator should understand the school's current status within five seconds.

## Empty school state

If a new school has no students or classes:

Do NOT show fake metrics.

Show:

**«Начните с первого класса»**

Primary button:

«Создать класс»

Secondary:

«Пригласить учителя»

Keep the empty state clean and helpful.

---

# 8. SCHOOL CLASSES MANAGEMENT

Create:

/school/classes

This is a core school feature.

## Classes list

Show all classes belonging to the active school.

Columns:
- Class
- Students
- Teachers
- Active assignments
- Actions

Primary action:

**«Создать класс»**

## Create class

Use a simple dialog or dedicated form.

Fields:
- Название класса
- Учебный год
- Куратор / назначенный учитель (optional)

Example:

11 «А»

2026–2027

Button:

«Создать»

Do not require a large form.

## Class detail

Route:

/school/classes/:classId

Show:

Header:
11 «А»

Summary:
- Students
- Assigned teachers
- Active assignments

Tabs:
- Ученики
- Учителя
- Задания
- Результаты

Actions:
- Пригласить учеников
- Назначить учителя
- Создать задание

Every action must work in the prototype and use the selected class context.

A class must belong to a specific school.

Prevent data leakage between organizations.

---

# 9. STUDENT INVITATIONS AND CLASS CODES

Schools should have two invitation methods.

## Method A: Email Invitations

An administrator or authorized teacher can invite students by email.

Fields:
- Email
- Class

For multiple users, support batch invitations and, later, validated CSV import.

Invitation link should connect the invited email or authorized recipient to the relevant class.

If the student already has a QazMind account, they must log in and accept the invitation.

If not, they register first.

Never automatically create passwords for students.

Never send plaintext passwords.

## Method B: Class Code

Every class can generate a secure joining code.

Example visual:

QM-8H2K7

This is a format example, not a shared hardcoded code.

Show:
- Code
- Copy action
- Expiration date
- Regenerate code
- Disable code

Joining by code must create a membership request requiring teacher or school approval, unless the institution has explicitly configured a secure alternative.

Rate-limit attempts and prevent code enumeration.

Do not reuse one universal code.

## Student Joining Flow

Student dashboard:

Settings or school invitation section.

Action:

**«Присоединиться к классу»**

Input:

«Код класса»

After submitting:

Show school and class identity.

Request confirmation and show pending approval where needed.

Upon approval:

Add the student to the class.

Keep all personal learning progress intact.

Do not create a duplicate account.

---

# 10. TEACHER INVITATIONS AND ROLES

School administrators can invite teachers.

Route:

/school/teachers

Actions:
- Пригласить учителя
- Назначить классы
- Изменить доступ
- Отозвать доступ

Teacher invitation fields:
- Email
- Name (optional)
- Assigned classes
- Role

An invited teacher receives a secure invitation or uses an existing account.

Teachers must never gain school-wide administrator privileges merely by joining.

An invitation is not valid after expiry or revocation.

Create clear states:
- Invitation pending
- Accepted
- Expired
- Revoked

Only school administrators may manage organization-wide membership and permissions.

---

# 11. CREATE A DEDICATED TEACHER WORKSPACE

Route:

/teacher

Do not show the entire school administrator interface to teachers.

Teachers need their own focused workspace.

## Teacher sidebar

- Главная
- Мои классы
- Задания
- Результаты
- Учебные материалы

At bottom:
- Settings
- Account

## Teacher home

Heading:

**«Мои классы»**

Show:
- Assigned classes
- Active assignments
- Pending submissions
- Recent results

Primary button:

**«Создать задание»**

Keep the design calm and productive.

No decorative widgets.

## Class view for teacher

Clicking a class opens:
- Student list
- Assigned learning activities
- Completion status
- Relevant performance summaries

Teachers must only see classes assigned to them.

Do not expose other classes from the same school unless permission is granted.

---

# 12. TEACHER ASSIGNMENT CREATION

This must be a real interactive workflow.

Teacher opens:

«Создать задание»

Use a minimal step-based interface.

## Step 1: Choose Class

Allow selecting one or more classes assigned to the teacher.

## Step 2: Choose Activity

Options:

- Изучить урок
- Практика по теме
- Тематический тест
- Пробное ЕНТ

Only show available content and assessment types.

## Step 3: Select Content

Choose:
- Subject
- Topic
- Specific lesson or test
- Number of questions, where applicable

Selection must use the actual learning content database.

Do not generate fake questions or silently substitute an unrelated subject.

## Step 4: Settings

Allow:
- Deadline
- Optional time limit
- Allowed attempts
- Whether results are visible immediately

Defaults should be sensible.

Avoid unnecessary settings.

## Step 5: Review

Show a concise summary.

Example:

11 «А»

История Казахстана

Казахское ханство

20 вопросов

Срок: 3 ноября

Action:

**«Назначить»**

After publication:
- Save assignment.
- Associate it with selected classes.
- Make it visible to eligible students.
- Record the publication time.
- Update teacher and school views.

Show an appropriate success state.

Do not claim assignments were published if no storage mechanism exists.

---

# 13. ASSIGNMENT LIFECYCLE

Implement clear assignment states.

Draft

Published

Active

Closed

Archived

Student-specific completion states:

Not Started

In Progress

Submitted

Evaluated

Teachers should be able to:
- Edit a draft
- Publish an assignment
- View submissions
- Close an assignment
- Archive an assignment

Once an assignment has submitted attempts, changes that would invalidate its assessment must be restricted or versioned.

Do not retroactively change questions for already completed exams.

Every student attempt must reference the correct assignment and content version.

Avoid duplicated result records.

---

# 14. STUDENT DASHBOARD INTEGRATION

This is extremely important.

DO NOT create a completely separate student learning application for school students.

The existing personal student dashboard must remain the main student interface.

When a student joins a school, add a school context to the existing dashboard.

Example:

Привет, Алия

School affiliation:

Школа №25 · 11 «А»

Then display a compact section:

**«Задания от школы»**

Example assignments:

История Казахстана

Тест · 20 вопросов

Deadline: 3 ноября

Button:

«Начать»

Another assignment:

Математика

Изучить урок

Button:

«Продолжить»

Keep independent preparation available.

The student must still have access to:
- Personal learning plan
- Subjects
- Practice
- Mock examinations
- Personal progress
- Mistake review

School affiliation adds assignments and school-provided access.

It must not replace personal learning functionality.

## Critical rule

If a student already has a QazMind account and later joins a school:

Do not reset learning history.

Do not overwrite selected exam profile subjects without confirmation.

Do not delete personal progress.

Do not force another registration.

Do not force repeating already completed onboarding.

---

# 15. SCHOOL ASSIGNMENTS USE FULLSCREEN FOCUS MODE

The existing QazMind application already supports or is expected to support dedicated fullscreen learning workflows.

REUSE THAT SYSTEM.

Do not build a second question engine for schools.

When a student clicks:

«Начать задание»

Open the appropriate fullscreen activity.

No normal dashboard sidebar.

No school administration navigation.

No mobile bottom navigation.

No distracting widgets.

For a school practice assignment:

Open fullscreen Practice Focus Mode.

For a school mock exam:

Open fullscreen Exam Focus Mode.

For an assigned lesson:

Open fullscreen Lesson Reader.

Preserve the original assignment context.

When the student completes the activity:

1. Save the attempt.
2. Save the result.
3. Mark the assignment accordingly.
4. Update the student's personal progress where appropriate.
5. Update the teacher's assignment results.
6. Update relevant school aggregates.
7. Show a clean completion screen.

Do not duplicate learning logic.

Do not calculate school scores using a separate misleading formula.

If content is incomplete, clearly mark it as a demonstration and report only the actual result.

---

# 16. SCHOOL ANALYTICS

Create:

/school/analytics

Analytics must be meaningful and derived from actual student activity.

Do not fabricate official score forecasts.

## School administrator analytics

Allow filtering by:
- Class
- Subject
- Teacher
- Assignment
- Date range

Show:
- Assignment completion rate
- Participation
- Average results on comparable assessments
- Topics where students struggle
- Assessment results by class

Only calculate averages from actual comparable results.

Do not mix scores from unrelated question sets into an apparently precise ЕНТ prediction.

Do not show charts when there is insufficient data.

## Teacher analytics

Teachers see only assigned classes.

Show:
- Students who completed assignments
- Students who have not started
- Correct and incorrect responses
- Common mistakes
- Topics requiring revision

## Individual student details

Teachers may open an eligible student's results for school-assigned activities within their assigned classes.

Do not expose private AI conversations.

Do not expose unrelated personal study history without appropriate authorization.

Do not expose sensitive personal information that is not necessary for educational purposes.

Use the minimum necessary data.

---

# 17. PRIVACY AND ACCESS CONTROL

This is critical because the platform may process minors' data.

Implement privacy-conscious defaults and the ability to record required consent or legal authorization.

The system must be designed to support applicable Kazakhstan personal data requirements.

Do not assume a school automatically owns all personal learning data.

School administrators should only see information necessary for institution management.

Teachers should only see information necessary for their assigned classes and activities.

Separate:
- Personal learning history
- School assignments
- School assignment results
- Organization memberships
- Institution licensing data

All server-side requests must validate:
- Authenticated identity
- Active organization membership
- Required role or permission
- Resource ownership and organization ID
- Teacher-to-class relationship where applicable

Never trust organization IDs or role flags supplied by a frontend form alone.

Prevent cross-school access to data.

Use secure invitation tokens.

Do not store passwords or sensitive credentials in localStorage.

Add appropriate audit logging for role changes, invitations, access revocations, and school membership changes.

If the current application is only a frontend prototype, preserve these boundaries in the architecture and clearly distinguish simulated behavior from secure production functionality.

---

# 18. SCHOOL ACCESS AND LICENSING

Create a simple licensing foundation.

Route:

/school/access

School administrators should see:
- Total available student seats
- Seats assigned
- Seats remaining
- Subscription or license status
- Expiration date, if applicable

If real billing is not configured, do not create fake payment processing.

Use clearly labeled prototype values only in demo mode.

School licenses should grant eligible educational access to assigned users.

Do not overwrite personal subscription status permanently.

If a school license expires:
- School-paid access can be suspended according to the license rules.
- Student personal accounts remain accessible.
- Personally owned learning history must not be erased.
- School-owned records are retained or deleted according to applicable retention policies.

Build the licensing model in a way that can later support paid institutional subscriptions.

---

# 19. PLATFORM ADMINISTRATOR

Create a minimal, protected platform administration module.

Only users with explicitly granted PLATFORM_ADMIN permissions can access it.

Suggested routes:

/admin/schools
/admin/schools/:organizationId

Features:
- View school applications
- Approve school applications
- Reject applications with reason
- View organization status
- Activate or suspend organization access
- Review basic license status

Do not expose these controls to school administrators.

Do not provide a UI option allowing ordinary users to promote themselves to platform administrator.

Approval actions require server-side authorization.

If the current project has no real backend, implement a clearly labeled local development demonstration rather than pretending the school is verified.

---

# 20. DATA MODEL AND ARCHITECTURE

Extend the existing data model rather than rewriting it unnecessarily.

Use stable identifiers and proper relationships.

Required entities:

users

student_profiles

organizations

organization_applications

organization_members

classes

class_members

teacher_class_assignments

invitations

class_join_codes

licenses

assignments

assignment_targets

assignment_attempts

assignment_results

learning_progress

exam_attempts

audit_logs

Separate organization membership from user identity.

Separate class enrollment from school membership.

Separate assignment publishing from student attempts.

Do not duplicate a student's user profile when they join a school.

Use the existing project framework and conventions.

Do not switch frameworks unnecessarily.

If a real backend and database already exist, implement the school features using that architecture.

If the application currently uses frontend-only state:

- Build a coherent repository/service abstraction.
- Implement working prototype flows using isolated development data.
- Persist non-sensitive demo state where appropriate.
- Clearly identify which operations require a real backend.
- Never label local role checks as production security.
- Never pretend that demo email invitations or account verification are real.

Do not automatically introduce a new paid backend service.

Do not introduce unnecessary infrastructure.

Focus on a clean, maintainable architecture.

---

# 21. RESPONSIVE DESIGN

All new school and teacher interfaces must support:

Desktop: 1440px

Tablet: 834px

Mobile: 390px

Desktop:
- Compact sidebar
- Spacious main workspace
- Useful data tables
- Clear hierarchy

Mobile:
- Collapsible navigation
- Readable class lists
- Responsive student rows
- Simple assignment creation
- No horizontal page overflow

For dense school administration tables, use carefully designed mobile alternatives or controlled horizontal table scrolling when appropriate.

Do not force desktop tables into unreadable narrow columns.

Student active learning sessions must continue using fullscreen Focus Mode on mobile.

Do not show a dashboard bottom navigation during an active test.

---

# 22. IMPORTANT REAL USER JOURNEYS

Implement complete workflows.

## FLOW A: Independent Student

Landing
→ Register as student
→ Email-based registration
→ Existing student onboarding
→ Personal dashboard
→ Independent learning

## FLOW B: New School

Landing
→ Schools page
→ Apply
→ Create or sign into representative account
→ Enter school information
→ Submit application
→ Pending verification
→ Platform admin approval
→ School setup
→ Create first class
→ Invite first teacher
→ Invite students

## FLOW C: Existing Student Joins School

Personal account
→ Join class
→ Enter class code or accept invitation
→ Membership verification or approval
→ School affiliation appears
→ School assignments become available
→ Personal progress remains intact

## FLOW D: Teacher Joins School

Receive invitation
→ Sign in or register
→ Accept invitation
→ Teacher workspace
→ Assigned classes
→ Create assignment
→ Publish assignment

## FLOW E: Student Completes School Assignment

Personal dashboard
→ School assignments
→ Open assignment
→ Fullscreen learning/test interface
→ Complete activity
→ Save result
→ Return to student dashboard
→ Teacher sees updated assignment result

## FLOW F: School Reviews Results

School workspace
→ Classes
→ Select class
→ Assignments
→ Select assignment
→ View completion and results
→ Identify difficult topics

## FLOW G: Student Leaves School

School membership ends
→ School-issued access updates
→ School assignments handled according to policy
→ Personal QazMind account remains
→ Personal learning history remains
→ School access controls are revoked

All flows must preserve correct permissions.

---

# 23. EMPTY STATES AND UX POLISH

Design meaningful empty states.

School without classes:

«Классов пока нет»

Button:
«Создать класс»

Class without students:

«В этом классе пока нет учеников»

Button:
«Пригласить учеников»

Teacher without assigned classes:

«У вас пока нет классов»

Text:
«Обратитесь к администратору школы.»

Assignments without results:

«Результатов пока нет»

Pending school application:

«Школа ожидает подтверждения»

Avoid large decorative empty-state illustrations.

Keep messages short.

Do not display fake achievements, fabricated student counts, or imaginary activity.

---

# 24. KEEP THE INTERFACE MINIMAL

Reduce unnecessary text throughout the new school experience.

Use short headings.

Examples:

Instead of:
«Управление образовательными процессами учебного заведения»

Use:
«Обзор школы»

Instead of:
«Добавление нового обучающегося в образовательную организацию»

Use:
«Пригласить ученика»

Instead of:
«Просмотр статистических показателей результативности выполнения учебных заданий»

Use:
«Результаты»

Instead of:
«Создание нового образовательного тестового задания для учащихся»

Use:
«Новое задание»

Use one primary action per page wherever possible.

Use progressive disclosure for advanced settings.

Do not create unnecessary wizard steps for simple operations.

Use short labels, consistent buttons, and predictable navigation.

The school application should feel fast and professional.

---

# 25. DO NOT BREAK EXISTING STUDENT FEATURES

Preserve:
- Student registration
- Student onboarding
- Personal dashboard
- Profile subject selection
- Target score selection
- Lessons
- Practice
- Mock exams
- Mistake review
- Personal progress
- Fullscreen Focus Mode
- Existing visual identity
- RU/KZ support

Extend the system cleanly.

Do not replace the existing student dashboard with a school dashboard.

Do not mix teacher and student navigation.

Do not make school enrollment mandatory for personal students.

Do not remove personal learning access from school-connected students.

---

# 26. IMPLEMENTATION PRIORITY

Work in this order.

PHASE 1:
Inspect the existing codebase, identify reusable components, current routing, authentication, and state management.

PHASE 2:
Extend the landing page with a school section and create the dedicated /schools page.

PHASE 3:
Add account type selection and school application flow while preserving existing student registration.

PHASE 4:
Implement organization memberships, roles, workspace switching, and protected routes.

PHASE 5:
Create school administrator dashboard, classes, school invitations, and student enrollment.

PHASE 6:
Create teacher workspace and assignment creation.

PHASE 7:
Connect school assignments to the existing fullscreen learning and testing engine.

PHASE 8:
Create school results, analytics, license overview, and platform-admin approval workflow.

PHASE 9:
Refine mobile layouts, empty states, error handling, accessibility, and interactions.

Do not rebuild the landing page unnecessarily.

Do not overwrite established components without a reason.

If a feature depends on missing backend capabilities, isolate it behind a clearly defined service interface and provide honest demo behavior rather than silently simulating production success.

---

# 27. QUALITY ACCEPTANCE CHECKLIST

Before finishing, verify:

[ ] The existing personal student experience still works.

[ ] Landing page has a visible Schools entry point.

[ ] /schools is a polished dedicated school landing page.

[ ] Registration distinguishes between students and school representatives.

[ ] Both registration paths use email rather than phone.

[ ] School representatives do not receive unverified organization access automatically.

[ ] Teachers can join through invitations without creating another school.

[ ] One user account can have multiple authorized contexts.

[ ] School administrators only see their organization.

[ ] Teachers only see assigned classes.

[ ] Students keep their personal learning progress.

[ ] Class creation works.

[ ] Class invitations work within the implemented environment.

[ ] Invitation codes can expire or be revoked.

[ ] Students can join a school through an authorized process.

[ ] A teacher can create and publish an assignment.

[ ] Assigned students can see the assignment.

[ ] Starting an assignment opens fullscreen Focus Mode.

[ ] Completing an assignment updates relevant records.

[ ] Teachers can review results for their assigned classes.

[ ] School administrators can view organization-level results.

[ ] No demo results are represented as real student performance.

[ ] School data cannot leak between organizations.

[ ] License information does not pretend to represent real payments.

[ ] New pages use the existing QazMind design language.

[ ] The mobile interface works properly.

[ ] No unnecessary decorative UI has been introduced.

[ ] Existing lessons, practice, exams, and progress pages continue to work.

---

# 28. FINAL PRODUCT EXPECTATION

The result should be a polished, coherent, multi-role EdTech ecosystem.

QazMind Personal:
A student studies independently.

QazMind Schools:
A school organizes ЕНТ preparation.

QazMind Teacher:
A teacher manages learning assignments and monitors results.

QazMind Platform Admin:
An authorized operator manages institutional access.

One account system.

One educational content platform.

One learning engine.

Multiple carefully designed workspaces.

Minimal interfaces.

Clear workflows.

Accurate data.

Strong privacy boundaries.

**DO NOT JUST DESIGN SCHOOL DASHBOARD SCREENS. IMPLEMENT THE CONNECTED APPLICATION FLOWS.**

Build a realistic school integration into the EXISTING QazMind project.

The final product should feel like professional educational software developed by an experienced product team, not a generic AI-generated management dashboard.