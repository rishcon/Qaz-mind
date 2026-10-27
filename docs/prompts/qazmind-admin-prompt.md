# QAZMIND ADMIN — COMPLETE PLATFORM ADMINISTRATION SYSTEM

## CRITICAL: EXTEND THE EXISTING APPLICATION

You are a senior SaaS product architect, frontend engineer, UX designer, and EdTech administration systems specialist.

You are working inside the EXISTING QazMind project.

QazMind is an educational platform for Kazakhstan, focused on preparing students for ЕНТ / ҰБТ.

The project already contains:

- Public landing page
- Student registration and onboarding
- Student dashboard
- Lessons and subject navigation
- Practice and exam interfaces
- Teacher workspace
- School administration workspace
- Organization management
- School assignments
- Learning progress interfaces
- Existing visual identity and components

Your task is to implement a **COMPLETE, PROFESSIONAL PLATFORM ADMINISTRATION FRONTEND** for the owner and authorized administrators of QazMind.

This administration system must control and manage the entire QazMind ecosystem.

### IMPORTANT REQUIREMENTS

DO NOT recreate the existing application.

DO NOT redesign the student dashboard.

DO NOT replace the existing teacher or school workspaces.

DO NOT modify the public landing page unless absolutely necessary.

DO NOT change the brand identity.

DO NOT introduce a new frontend framework.

DO NOT create an unrelated standalone dashboard.

Integrate the administration system into the existing React, TypeScript, and Vite project.

Inspect the existing codebase before implementation.

Reuse existing components, styling conventions, utilities, and routing where appropriate.

The result must be a deeply connected and interactive administration interface, not a collection of static screens.

**This task is FRONTEND ONLY.**

Do not attempt to implement a production backend, database, real authentication, or payment processing.

Prepare frontend architecture and API-ready service interfaces for future integration with FastAPI and PostgreSQL.

Use clearly identified development demo data where necessary.

---

# 1. ADMINISTRATION SYSTEM VISION

Create:

**QazMind Admin**

A comprehensive administrative control center for managing the entire educational platform.

The administrator should be able to manage:

1. Platform overview
2. Students and user accounts
3. Schools and organizations
4. Teachers
5. Subjects and curricula
6. Lessons and educational content
7. Question bank
8. Exam construction and configuration
9. Practice configurations
10. School assignments
11. Learning analytics
12. User activity and history
13. Administrative audit logs
14. Financial subscriptions and licenses
15. Support requests
16. Content complaints and moderation
17. System monitoring
18. Notifications
19. Administrative roles and permissions
20. Platform settings

The system must feel like a real operational SaaS platform.

Every primary page should have a clear purpose.

Every important action should have an understandable workflow.

Every module should connect logically with related modules.

---

# 2. DESIGN PHILOSOPHY

Preserve the existing QazMind visual identity.

Brand:

qazmind.

Colors:

- Main background: #F5F3EE
- Main text: #171717
- Accent: #FF5A36
- Surface: #FFFFFF
- Secondary background: #F0EEE8
- Borders: #E2DED5
- Success: #258568
- Warning: #D89B35
- Error: #C94A43

The admin interface should be more information-dense and practical than the student interface.

Visual direction:

**Premium Minimal Admin Workspace + Swiss Editorial Precision + Professional Data Management UI**

Use inspiration from Linear, Stripe Dashboard, Vercel Dashboard, and modern enterprise SaaS products.

Do not copy these products directly.

### Design principles

- Minimalist
- Highly structured
- Professional
- Fast to navigate
- Information-dense without clutter
- Excellent typography
- Clear hierarchy
- Predictable interactions
- Precise alignment
- Restrained use of colors

Avoid:

- Generic AI-generated SaaS cards
- Excessive gradients
- Glowing effects
- Huge rounded corners
- Heavy black shadows
- Random decorative illustrations
- Large empty dashboard sections
- Repetitive uppercase labels
- Extremely small text
- Meaningless charts
- Fake metrics
- Excessive animations
- Walls of explanatory text

Use readable interface text, generally 14px or larger for main controls and tables.

Use compact but accessible spacing.

No emoji icons.

All visible interface text must be in natural Russian.

Prepare components and translation keys for Kazakh localization.

---

# 3. ADMIN ROUTING AND APPLICATION LAYOUT

Create a dedicated administration workspace.

Base route:

/admin

Example routes:

/admin
/admin/users
/admin/users/:userId
/admin/schools
/admin/schools/:schoolId
/admin/teachers
/admin/content
/admin/content/subjects
/admin/content/lessons
/admin/content/questions
/admin/content/questions/new
/admin/content/questions/:questionId
/admin/exams
/admin/exams/:examId
/admin/assignments
/admin/analytics
/admin/activity
/admin/audit
/admin/finance
/admin/support
/admin/reports
/admin/monitoring
/admin/notifications
/admin/roles
/admin/settings

Use nested routes or an equivalent maintainable routing architecture.

The existing student, school, and teacher routes must remain unchanged.

## Admin authentication boundary

Create a dedicated AdminLayout and permission boundary.

Only authorized platform administration roles should be able to access it.

The frontend route guard is for user experience only. Real authorization will later be enforced by the FastAPI backend.

Never treat a localStorage role flag as secure production authorization.

Do not add a public button that grants platform administrator privileges.

For local development, provide an isolated developer demo mode for viewing admin roles, clearly labeled as non-production.

---

# 4. ADMIN SIDEBAR

Create a professional, compact, collapsible sidebar.

At the top:

qazmind.

Small secondary label:

ADMIN

Navigation structure:

### ОСНОВНОЕ

- Обзор
- Пользователи
- Школы
- Учителя

### ОБУЧЕНИЕ

- Предметы
- Уроки
- Банк вопросов
- Экзамены
- Задания

### АНАЛИТИКА

- Аналитика
- Активность
- История действий

### УПРАВЛЕНИЕ

- Подписки
- Обращения
- Жалобы
- Мониторинг
- Уведомления

### СИСТЕМА

- Администраторы
- Настройки

Bottom:
- Administrator profile
- Current role
- Logout
- Workspace switching if applicable

Do not display dozens of menu items at once if a grouped collapsible structure would be clearer.

Support active navigation states.

Allow collapsing the sidebar to an icon-only mode.

Use clear icons with consistent sizing.

---

# 5. GLOBAL ADMIN TOP BAR

Create a compact, functional top navigation bar.

Include:

- Breadcrumbs
- Global search
- Notifications
- Quick actions
- Administrator profile menu

## Global Search

Search across authorized resources:

- Users
- Schools
- Teachers
- Subjects
- Lessons
- Questions
- Exams
- Assignments

Results should be categorized.

Example query:

"История Казахстана"

Results might show:
- Subject
- Lessons
- Questions
- Exams containing that subject

Use a command-palette-style search interface.

Keyboard shortcut:

Ctrl+K / Cmd+K

Search results must navigate to the actual corresponding detail screen.

In demo mode, search should filter the available local data rather than showing unrelated invented suggestions.

Respect role-based visibility.

---

# 6. MAIN ADMIN DASHBOARD

Route:

/admin

Page heading:

**«Обзор платформы»**

Create a carefully structured operational dashboard.

This is the primary workspace for the QazMind owner.

## Main metrics

Display:

- Всего пользователей
- Активные пользователи
- Подключённые школы
- Активные преподаватели
- Завершённые тесты
- Активные подписки

Additional metrics when real billing data is available:

- Выручка
- Новые подписки
- Истекающие лицензии

Add period filters:

- Сегодня
- 7 дней
- 30 дней
- Произвольный период

Use compact metric components.

Avoid giant cards with decorative icons.

## Platform activity chart

Show actual or explicitly labeled sample user activity.

Selectable metrics:
- New registrations
- Daily active users
- Completed learning sessions
- Exam attempts

Support switching the selected metric.

Use precise labels and readable date axes.

Do not create meaningless sample graphs without indicating that the information is demonstration data.

## Requires attention

Create an operational section:

**«Требует внимания»**

Possible items:

- New school applications
- Pending content reviews
- Question complaints
- Failed background jobs
- Expiring licenses
- Support tickets requiring response

Every row must be clickable and open the appropriate filtered section.

## Recent activity

Show recent important platform events:

- User registered
- School submitted application
- Teacher invited
- Question published
- Exam configuration updated
- Subscription changed

Include:
- Timestamp
- Event type
- Relevant resource
- Status

Do not make this an unrestricted feed of private student activity.

---

# 7. COMPLETE USER MANAGEMENT

Route:

/admin/users

This must be a functional user management interface.

## User table

Columns:

- User
- Email
- Account type
- Organization
- Registration date
- Last activity
- Status
- Actions

Features:

- Search by name or email
- Filter by role
- Filter by account status
- Filter by organization
- Filter by registration period
- Sorting
- Pagination
- Column visibility
- Multi-select where appropriate
- Export of authorized, filtered information

Account statuses:

Active
Pending Verification
Suspended
Deactivated

Avoid exposing sensitive personal information unnecessarily.

## User detail page

Clicking a user opens a comprehensive user profile.

Route:

/admin/users/:userId

Use a structured detail page with tabs.

### TAB 1: Overview

Show:
- Name
- Email
- User ID
- Registration date
- Account status
- Account type
- Organization memberships
- Selected study subjects, if relevant
- Target ЕНТ score, if relevant

### TAB 2: Learning

For student accounts:

Show:
- Completed lessons
- Practice sessions
- Exam attempts
- Subject progress
- School assignment completion
- Relevant result summaries

Use actual authorized student data only.

### TAB 3: Organizations

Show schools and classes the user belongs to.

For teachers, show assigned classes.

### TAB 4: Activity

Show a scoped activity history:

- Login events
- Account settings changes
- Lesson completion
- Exam attempt creation and submission
- Assignment completion
- Organization membership changes

Detailed student activity visibility must respect defined administrative permissions, retention policies, and privacy rules.

Do not expose private AI conversations by default.

### TAB 5: Security

Show:
- Email verification status
- Account suspension status
- Session revocation action
- Available security events

Do not show passwords or authentication tokens.

## User actions

Allow authorized administrators to:
- Suspend account
- Reactivate account
- Revoke active sessions
- Review organization memberships
- Review support history
- Initiate appropriate account deletion or export workflow

Critical actions must require confirmation and be recorded in the audit log.

Do not implement destructive bulk deletion without clear safeguards.

No plaintext password viewing or editing.

---

# 8. SCHOOL AND ORGANIZATION MANAGEMENT

Route:

/admin/schools

Build full organization management.

## School list

Columns:

- School name
- City
- Organization type
- Number of students
- Teachers
- Classes
- License status
- Approval status

Filters:
- Pending verification
- Approved
- Rejected
- Suspended
- Active
- Expired license

## School applications

Create a dedicated pending applications view.

For each application show:
- Organization name
- Contact person
- Contact email
- City
- Submission date
- Submitted information
- Verification status

Actions:
- Approve
- Reject
- Request clarification

Display clear confirmation dialogs.

Every action must create a corresponding audit event in the demo data layer.

## School detail page

Tabs:

- Overview
- Students
- Teachers
- Classes
- Assignments
- Results
- Licenses
- Activity
- Settings

Allow authorized actions:
- View school details
- Update verified organization metadata
- Review class membership
- Review assigned teachers
- Manage license allocation
- Suspend organization access

A school administrator must not be able to access other schools' private data.

---

# 9. TEACHER MANAGEMENT

Route:

/admin/teachers

Provide an overview of all teacher accounts.

Table:

- Name
- Email
- School
- Assigned classes
- Account status
- Last activity

Teacher detail page:

- Account information
- School memberships
- Assigned classes
- Created assignments
- Assignment completion summaries
- Relevant administrative events

Support authorized actions:
- Review profile
- Revoke a specific organization membership
- Inspect relevant assignment history
- Review support cases

Do not allow an administrator to silently change a teacher's data without audit logging.

---

# 10. COMPLETE EDUCATIONAL CONTENT MANAGEMENT SYSTEM

This is one of the most important parts of QazMind Admin.

Build a professional educational CMS.

Administrators and authorized content editors must be able to manage the entire curriculum without editing source code.

## Subject management

Route:

/admin/content/subjects

Display all subjects.

Each subject has:
- Stable ID
- Name in Russian
- Name in Kazakh
- Description
- Subject type
- Status
- Topic count
- Lesson count
- Question count

Subject types:
- Mandatory ЕНТ subject
- Profile ЕНТ subject

Actions:
- Create subject
- Edit subject
- Archive subject
- Open curriculum
- View associated questions

Do not allow destructive deletion of a subject with historical attempts without a defined migration or archival workflow.

## Curriculum structure

Hierarchy:

Subject
→ Section
→ Topic
→ Lesson
→ Practice

Allow:
- Create sections
- Create topics
- Reorder lessons
- Edit names
- Change visibility
- Archive outdated content

Use drag-and-drop ordering where appropriate.

Do not let drag-and-drop accidentally modify published historical exam attempts.

---

# 11. PROFESSIONAL LESSON EDITOR

Route:

/admin/content/lessons

Create a rich educational lesson management interface.

## Lessons table

Columns:
- Lesson title
- Subject
- Topic
- Language
- Status
- Last modified
- Editor

Filters:
- Subject
- Status
- Language
- Editor

Actions:
- Create lesson
- Edit lesson
- Duplicate draft
- Preview
- Submit for review
- Publish
- Archive

## Lesson Editor

Create a professional block-based content editor.

Supported blocks:

- Heading
- Paragraph
- Highlighted important fact
- Numbered list
- Bullet list
- Image
- Table
- Timeline
- Formula
- Quote
- Interactive question reference
- Callout
- Divider

The editor must feel like real content management software.

Use a clean reading layout.

Provide:
- Formatting toolbar
- Content blocks
- Reordering
- Save draft
- Preview
- Publication settings

Allow independent Russian and Kazakh versions of educational content.

Include content metadata:
- Subject
- Topic
- Estimated duration
- Difficulty
- Learning objectives
- Language
- Status

Use an API-ready asset upload abstraction.

If no backend storage exists, clearly label attachments as local prototype assets.

## Editorial workflow

Statuses:

Draft
In Review
Approved
Published
Archived

Show:
- Author
- Reviewer
- Modification history
- Publication date
- Version number

Published changes must not silently corrupt already completed learning sessions.

---

# 12. COMPLETE QUESTION BANK

This is a top-priority module.

Route:

/admin/content/questions

Create a powerful and genuinely usable question management system for ЕНТ preparation.

The administrator should be able to create, edit, import, review, and organize thousands of questions.

## Question bank table

Columns:

- Question ID
- Short question preview
- Subject
- Topic
- Type
- Difficulty
- Language
- Status
- Last modified
- Author

Features:

- Full-text search
- Subject filter
- Topic filter
- Question type filter
- Difficulty filter
- Language filter
- Publication status filter
- Author filter
- Pagination
- Bulk selection
- Bulk review actions
- Export filtered list
- Duplicate draft
- Archive

Use compact, readable data tables.

Do not display the entire question text in the table.

Clicking a row opens the full question editor.

## Create Question

Primary button:

**«Добавить вопрос»**

Open a full-page question editor, not a small cramped modal.

Route:

/admin/content/questions/new

### Question metadata

Fields:
- Subject
- Section
- Topic
- Language
- Difficulty
- Question type
- Source/reference
- Tags
- Editorial status

Subject and topic options must come from existing curriculum data.

Do not use unrelated hardcoded values.

### Question types

The editor should support configurable formats relevant to ЕНТ and the learning platform.

1. Single correct answer
2. Multiple correct answers
3. Matching
4. Context-based question groups
5. Numerical answer for learning practice, where applicable

Do not assume all formats use the same scoring model.

Use an extensible type-based component architecture.

### Single Choice Editor

Fields:
- Question text
- Optional image
- Answer options
- Correct answer
- Explanation

Actions:
- Add option
- Remove option
- Change correct answer
- Preview

### Multiple Choice Editor

Allow selecting several correct answers.

Validate minimum and maximum selections according to the configured assessment rules.

### Matching Editor

Create two configurable columns with matching relationships.

Provide a visual preview of how the question will appear to students.

### Context Question Editor

Support:
- Shared passage or source material
- Optional image or table
- Multiple associated questions
- Question ordering
- Context preview

### Explanation

Every question should support an educational explanation.

Fields:
- Explanation in Russian
- Explanation in Kazakh
- Optional reference
- Related lesson

Do not automatically generate explanations and pretend they are verified.

### Editor actions

- Save draft
- Preview as student
- Submit for review
- Approve
- Publish
- Archive

Show clear validation errors.

Prevent publishing incomplete questions.

Support unsaved-changes warnings.

---

# 13. BULK QUESTION IMPORT

Create an import interface.

Route:

/admin/content/questions/import

Support CSV and XLSX import workflows in the frontend architecture.

Important:

Do not pretend XLSX parsing works if the required parser is not installed.

Use a real supported parser when available, or provide a clearly marked integration placeholder.

## Import steps

1. Upload file
2. Detect columns
3. Map fields
4. Validate rows
5. Preview questions
6. Review duplicates
7. Import valid drafts

Show:
- Total rows
- Valid rows
- Invalid rows
- Potential duplicates
- Import errors

Provide a downloadable import template.

Do not silently discard invalid rows.

Questions should import as drafts rather than being automatically published.

Add an import history view:
- Import date
- Actor
- Filename
- Validated row count
- Imported count
- Error count

All results must reflect real parsing or clearly identified demonstration behavior.

---

# 14. QUESTION REVIEW AND QUALITY CONTROL

Create an editorial moderation workflow.

Route:

/admin/content/review

Content editors may create questions.

Reviewers inspect them.

Authorized reviewers approve or reject content.

Statuses:

Draft
In Review
Changes Requested
Approved
Published
Archived

Review interface should include:

- Question preview
- Correct answers
- Explanation
- Source
- Change history
- Author
- Reviewer comments

Actions:
- Approve
- Request changes
- Reject publication

Support detailed reviewer feedback.

Do not automatically approve AI-generated material.

Create a quality dashboard:
- Questions awaiting review
- Missing explanations
- Missing Kazakh translations
- Reported questions
- Potential duplicates

---

# 15. EXAM BUILDER AND CONFIGURATION

Route:

/admin/exams

Create a professional exam management module.

The administrator must be able to configure ЕНТ exam formats and build exam sets from the verified question bank.

## Exam list

Show:
- Exam title
- Exam type
- Version
- Question count
- Duration
- Maximum score
- Status
- Publication date

Actions:
- Create exam
- Edit draft
- Preview
- Publish
- Archive

## Exam Builder

Create an interactive step-based editor.

Step 1:
Exam metadata.

Step 2:
Select assessment format and version.

Step 3:
Choose mandatory subjects and relevant profile subject configuration.

Step 4:
Select verified questions.

Step 5:
Configure scoring according to the selected approved exam specification.

Step 6:
Preview and validate.

Step 7:
Publish.

Important:

ЕНТ rules must be configurable and versioned.

Do not permanently hardcode official exam rules into UI components.

The current format may include 120 questions, a maximum score of 140, and a 240-minute duration, but the configuration must be editable for later official changes.

Never convert a five-question demonstration exam into an artificial 140-point official result.

## Exam preview

Administrators can open a fullscreen student-style exam preview.

Reuse the existing Focus Mode components.

No sidebar during the preview.

Preview must be clearly labeled so that preview submissions do not enter real student analytics.

## Exam publication

Published exams should reference an immutable version of their question set and scoring configuration.

Editing a draft must not change previously submitted exam attempts.

---

# 16. ASSIGNMENT MANAGEMENT

Route:

/admin/assignments

Display school assignments across authorized organizations.

Columns:
- Assignment title
- School
- Class
- Teacher
- Subject
- Activity type
- Deadline
- Status
- Completed / Assigned

Filters:
- Organization
- Teacher
- Class
- Subject
- Status
- Date range

Assignment detail:
- Configuration
- Target classes
- Assigned students
- Completion statistics
- Attempt results
- Publication history

Platform administrators can inspect operational issues and valid administrative metadata.

Do not permit routine access to private student content beyond authorized purposes.

Do not overwrite assessment history when an assignment is edited.

---

# 17. PLATFORM ANALYTICS

Route:

/admin/analytics

Create a real analytics workspace.

Tabs:

### Audience

- Registrations over time
- Active users
- Returning users
- Student onboarding completion
- Distribution by account type

### Learning

- Lessons started
- Lessons completed
- Practice attempts
- Exam attempts
- Frequently studied subjects

### Content Quality

- Frequently incorrect questions
- Reported content
- Low-completion lessons
- Questions missing explanations
- Content review backlog

### Schools

- Connected schools
- Active classes
- Assigned activities
- Assignment completion
- School engagement

### Revenue

- Active subscriptions
- Paid seats
- Revenue trends
- Expired licenses
- Payment failures

Only show revenue when actual billing data exists.

For the current frontend prototype, use an explicitly labeled demo dataset.

Use filters:
- Date range
- Organization
- Subject
- User segment

Every chart should have readable labels.

Provide empty states when data is unavailable.

Do not generate arbitrary percentages presented as real platform statistics.

---

# 18. USER ACTIVITY HISTORY

Route:

/admin/activity

Create a professional event history interface.

This section is distinct from the administrative audit log.

Its purpose is to understand platform usage and troubleshoot user journeys within authorized boundaries.

Example event categories:

- Account registration
- Email verification
- Login
- Onboarding completion
- Lesson started
- Lesson completed
- Practice started
- Practice completed
- Exam started
- Exam submitted
- School joined
- Assignment submitted

Each event should contain:

- Timestamp
- Event type
- User reference
- Resource type
- Resource ID
- Result/status

Use privacy-conscious summaries.

Do not store or show raw passwords, authentication tokens, private AI conversations, or unnecessary sensitive information.

Avoid tracking every click or every keystroke.

Use explicit data retention and role-based visibility policies.

## Activity filters

- Date range
- Event category
- User
- Organization
- Resource type
- Status

Clicking an event opens a detailed event view with available non-sensitive metadata.

Show event timestamps consistently and allow a timezone-aware display.

---

# 19. FULL ADMINISTRATIVE AUDIT LOG

Route:

/admin/audit

This is a critical module.

Create a dedicated immutable-style audit log interface for consequential administrative actions.

The UI must support reviewing:

**Who performed an action, what changed, when it happened, and which resource was affected.**

Example events:

- Administrator approved school
- User account suspended
- Account reactivated
- Teacher membership revoked
- Question edited
- Question published
- Lesson archived
- Exam configuration changed
- Subscription modified
- Administrative role granted
- Administrative permission revoked

## Audit table

Columns:

- Timestamp
- Actor
- Action
- Module
- Resource
- Outcome

## Detailed audit event

Show:

Event ID

Actor ID

Actor role

Event timestamp

Action type

Affected resource

Previous values, when appropriate

New values, when appropriate

Status

Request correlation ID, when available

Sensitive fields must be redacted.

Never show password values, access tokens, full payment details, or secrets in before/after changes.

## Filters

- Actor
- Date range
- Module
- Action type
- Resource
- Result

## Export

Provide authorized audit export UI.

Include:
- Date range
- Event categories
- File format

A real backend audit log must be append-only and tamper-resistant.

In the frontend demo, implement a clearly labeled local event history that demonstrates the behavior without claiming security guarantees.

Record meaningful state-changing demo actions into that demo audit history.

Do not prepopulate fake events and imply they happened on the real platform.

---

# 20. SUPPORT TICKETS

Route:

/admin/support

Create a support management interface.

Ticket table:

- Ticket ID
- Subject
- User
- Category
- Priority
- Status
- Created date
- Assigned administrator

Ticket statuses:

New
In Progress
Waiting for User
Resolved
Closed

Features:
- Open ticket
- Assign staff member
- Change status
- Add internal note
- Write response draft
- View ticket timeline

Separate internal notes from user-facing messages.

Do not claim an email or notification was sent without an integrated delivery service.

Use a service abstraction for future messaging integration.

---

# 21. QUESTION COMPLAINTS AND CONTENT REPORTS

Route:

/admin/reports

Students should eventually be able to report:
- Incorrect answer
- Question typo
- Unclear wording
- Incorrect translation
- Missing image
- Other content issue

Admin interface:

Show:
- Reported question
- Report type
- Report date
- Report status
- Number of reports
- Related subject

Actions:
- Review report
- Open question
- Request content correction
- Mark resolved
- Reject report with reason

Every resolution must produce an audit event.

Connect the report to the question's editorial history.

When a correction affects a published question, maintain proper versioning.

Do not silently modify previous exam attempts.

---

# 22. SUBSCRIPTIONS, LICENSES, AND FINANCE

Route:

/admin/finance

Create a finance and licensing administration frontend.

Tabs:

- Overview
- Subscriptions
- School Licenses
- Transactions
- Plans

## Subscription list

Show:
- User or organization
- Plan
- Status
- Start date
- End date
- Billing period

Statuses:
- Trial
- Active
- Past Due
- Cancelled
- Expired

## School licensing

Show:
- School
- Plan
- Purchased seats
- Assigned seats
- Available seats
- Expiration
- Status

Allow authorized administrators to preview a license adjustment workflow.

Do not silently give unlimited licenses.

Billing-related changes must be explicitly confirmed and audited.

## Plans

Support frontend management for:
- QazMind Free
- QazMind Plus
- QazMind Schools

Pricing should remain configurable.

Do not invent actual subscription prices.

Do not implement fake payment success.

Future integration with a payment provider should be handled by a dedicated backend service.

---

# 23. SYSTEM MONITORING

Route:

/admin/monitoring

Create a technical operations interface.

The purpose is to help the platform owner understand the health of the application.

Sections:

### Services

- Frontend
- API
- PostgreSQL
- Email provider
- Background workers
- Object storage

States:

Healthy
Degraded
Unavailable
Unknown

### API Monitoring

Display:
- Request volume
- Error rate
- Average response time
- Failed requests

### Background Jobs

Show:
- Job type
- Created time
- Current status
- Attempts
- Failure reason

### Email Delivery

Show:
- Pending messages
- Sent messages
- Failed messages

### Database and Backups

Show:
- Database connection status
- Last successful backup
- Backup failure status

Do not simulate successful backups or healthy production services as if these were real.

Until backend monitoring exists, show a clearly marked integration preview.

Provide a structure ready to receive real monitoring API responses later.

---

# 24. ADMIN NOTIFICATIONS

Route:

/admin/notifications

Create an administrative notification center.

Notification categories:
- School applications
- Content reports
- Support tickets
- System alerts
- License expiration
- Review requests

Features:
- Mark as read
- Filter
- Open related resource
- Dismiss
- Notification preferences

Use actual in-app demo events to generate notifications during prototype interactions.

Do not fabricate delivery through email or push services.

---

# 25. ADMINISTRATIVE ROLES AND PERMISSIONS

Route:

/admin/roles

Create a role-based administration system.

Roles:

### OWNER

Complete platform administration privileges.

### PLATFORM_ADMIN

Manage organizations, users, support, and permitted operational settings.

### CONTENT_MANAGER

Manage subjects, lessons, and questions.

### CONTENT_REVIEWER

Review and approve educational materials.

### SUPPORT_AGENT

Handle support tickets with limited user information access.

### FINANCE_MANAGER

Manage subscriptions, licensing, and permitted billing operations.

### ANALYST

Read-only access to approved aggregate analytics.

Do not assume every administrator should have access to everything.

Create a permission matrix UI.

Example permissions:
- users.read
- users.suspend
- schools.read
- schools.approve
- content.create
- content.edit
- content.publish
- exams.manage
- finance.read
- finance.manage
- audit.read
- roles.manage
- settings.manage

Show effective permissions per role.

Allow authorized administrators to assign roles through a confirmation workflow.

Never allow a normal user to elevate their own role.

The production backend will ultimately enforce all permissions.

Frontend permission hiding alone is insufficient security.

---

# 26. PLATFORM SETTINGS

Route:

/admin/settings

Create structured settings sections.

### General

- Platform name
- Support email
- Default language
- Available languages
- Public registration configuration

### Educational Settings

- Available ЕНТ specification versions
- Default study preferences
- Subject availability
- Practice configuration

### Access Settings

- Registration policies
- School application policies
- Invitation expiration settings

### Notifications

- Administrative alert preferences
- Email notification templates

### Maintenance

- Maintenance mode configuration
- Feature flags
- Module availability

Do not expose database credentials, secret keys, API tokens, or environment secrets in the frontend.

Feature flags and sensitive platform settings must eventually be server-controlled.

---

# 27. SHARED ADMIN UI COMPONENT SYSTEM

Create reusable components for:

AdminLayout

AdminSidebar

AdminTopbar

Breadcrumbs

GlobalSearch

DataTable

Pagination

Filters

DateRangePicker

StatusBadge

MetricDisplay

ResourceDetailHeader

TabNavigation

FormField

SelectField

ConfirmationDialog

Drawer

Toast

EmptyState

ErrorState

LoadingSkeleton

QuestionEditor

LessonEditor

QuestionPreview

AuditEventDetail

ActivityTimeline

PermissionGate

ExportDialog

ImportWizard

Use consistent component behavior.

Do not create slightly different table systems for every module.

Use one standard table pattern with configurable columns, filters, sorting, and pagination.

---

# 28. INTERACTION REQUIREMENTS

The administration frontend must behave like a working product.

Every primary action should perform a meaningful operation against the demo repository or service abstraction.

Examples:

- Creating a draft question adds it to the question bank.
- Editing a question updates its displayed metadata.
- Publishing a question changes its status.
- Creating a subject updates the curriculum directory.
- Adding a topic changes the subject structure.
- Creating a lesson makes it available in the CMS.
- Approving a school changes its application status.
- Suspending a demo user updates its status.
- Changing a license allocation updates the displayed count.
- Resolving a content report updates the moderation queue.
- Administrative mutations create relevant demo audit events.

These operations should remain coherent across related pages.

Do not create buttons that simply display a generic success toast without changing state.

Provide:
- Loading states
- Success states
- Validation errors
- Empty states
- Permission-denied states
- Confirmation dialogs
- Unsaved-changes warnings
- Retry actions for recoverable failures

Navigation should work with browser Back and Forward.

Filters and pagination should be reflected in URL query parameters where appropriate.

---

# 29. FRONTEND STATE AND DATA ARCHITECTURE

Design the admin frontend to be ready for a future FastAPI REST backend.

Separate:

UI Components

Page Components

Feature Modules

Data Models

Service Interfaces

Mock Repositories

API Clients

Permissions

Audit Event Types

Do not embed huge arrays of fake data directly inside page components.

Use typed TypeScript interfaces.

Suggested frontend folders:

src/admin/
  components/
  layouts/
  pages/
  features/
    dashboard/
    users/
    schools/
    teachers/
    subjects/
    lessons/
    questions/
    exams/
    assignments/
    analytics/
    activity/
    audit/
    finance/
    support/
    reports/
    monitoring/
    roles/
    settings/
  services/
  repositories/
  types/
  hooks/
  utils/

Adapt to the existing project structure rather than forcing a complete rewrite.

Create service contracts compatible with future endpoints such as:

GET /api/v1/admin/overview

GET /api/v1/admin/users

GET /api/v1/admin/users/:id

GET /api/v1/admin/schools

GET /api/v1/admin/questions

POST /api/v1/admin/questions

PATCH /api/v1/admin/questions/:id

GET /api/v1/admin/audit

GET /api/v1/admin/analytics

GET /api/v1/admin/monitoring

Do not make real network calls to nonexistent endpoints.

Use a configurable mock adapter now.

Make switching to the real API straightforward later.

Never store passwords, production keys, or actual privileged authentication tokens in localStorage.

---

# 30. DEMONSTRATION DATA RULES

This is frontend development, so some data must be simulated.

Create a separate developer demo dataset.

The demo should contain enough connected records to exercise the interface:

- Several schools
- Multiple classes
- Several teacher records
- Student accounts
- Subjects
- Topics
- Lessons
- Example questions
- Example exam drafts
- Assignments
- Support tickets
- Administrative audit events

All demo records must be clearly synthetic.

Use consistent references between entities.

A question assigned to History must belong to History.

A teacher's class must belong to the appropriate school.

An assignment must reference a real demo class.

Avoid random values that change on every render.

Do not present synthetic data as actual QazMind business performance.

Use a small visible "Демо-данные" indicator in relevant admin sections.

For empty real-data states, show honest empty states.

Do not automatically create fake user achievements.

---

# 31. RESPONSIVE DESIGN

Create layouts for:

Desktop: 1440px

Tablet: 834px

Mobile: 390px

Desktop administration should prioritize productivity and data density.

Mobile:
- Collapsible navigation
- Responsive lists
- Readable forms
- Action menus
- Clearly separated details

For complex question editing or large data tables, provide sensible responsive alternatives rather than squeezing everything into narrow columns.

Do not allow horizontal page overflow.

Ensure accessible focus states and comfortable touch targets.

---

# 32. REQUIRED END-TO-END FRONTEND FLOWS

Implement these flows using the demo service layer.

### FLOW 1: Create and Publish a Question

Admin
→ Question Bank
→ Add Question
→ Select Subject
→ Select Type
→ Enter Question
→ Configure Correct Answer
→ Add Explanation
→ Save Draft
→ Preview
→ Submit for Review
→ Approve with authorized role
→ Publish
→ Question appears in published list
→ Audit history records changes

### FLOW 2: Create a Lesson

Admin
→ Subjects
→ Choose Subject
→ Choose Topic
→ Add Lesson
→ Edit Content
→ Save
→ Preview
→ Publish
→ Lesson appears in curriculum

### FLOW 3: Approve a School

Admin
→ Schools
→ Applications
→ Open Application
→ Review
→ Approve
→ Organization status updates
→ Audit event appears

### FLOW 4: Review a User

Admin
→ Users
→ Search
→ Open Profile
→ View authorized learning/activity data
→ Suspend Account
→ Confirm
→ Account status changes
→ Audit event appears

### FLOW 5: Review Platform History

Admin
→ Audit
→ Select Date Range
→ Filter by Action
→ Open Event
→ View actor, resource, timestamp, and permitted changes

### FLOW 6: Build an Exam

Admin
→ Exams
→ New Exam
→ Select Specification
→ Add Verified Questions
→ Configure Scoring
→ Preview
→ Validate
→ Publish

### FLOW 7: Resolve a Question Complaint

Admin
→ Content Reports
→ Open Report
→ Review Question
→ Request Correction
→ Update Question Draft
→ Review New Version
→ Resolve Report
→ Audit Log Updated

### FLOW 8: Manage School License

Admin
→ Finance
→ School Licenses
→ Select School
→ Edit Seat Allocation
→ Confirm
→ Demo License Updates
→ Audit Event Appears

Every flow must be navigable and functional in the frontend prototype.

---

# 33. PERFORMANCE AND USABILITY

Plan for thousands of users and tens of thousands of questions.

Do not render entire large datasets at once.

Use:
- Pagination
- Debounced search
- Lazy-loaded modules
- Efficient filtering
- Reusable queries
- Stable identifiers
- Optimized editor rendering

Preserve filter state when returning from a detail page.

Make forms keyboard-friendly.

Support appropriate error boundaries.

Prefer predictable behavior over excessive animation.

---

# 34. ACCEPTANCE CHECKLIST

Verify:

[ ] Existing QazMind student interface remains intact.

[ ] Existing teacher interface remains intact.

[ ] Existing school interface remains intact.

[ ] Admin routes use a separate layout.

[ ] Admin access is represented through explicit permissions.

[ ] All admin sidebar destinations open correctly.

[ ] Dashboard uses connected demo data.

[ ] Users can be searched, filtered, and opened.

[ ] User details show relevant authorized history.

[ ] School applications can be reviewed in demo mode.

[ ] Subjects can be created and edited.

[ ] Topics and lessons can be organized.

[ ] Lesson drafts can be edited and previewed.

[ ] Questions can be created and edited.

[ ] Single-choice and multiple-choice question editors work.

[ ] Matching and context-based editors have meaningful interactions.

[ ] Question filtering and pagination work.

[ ] Question review and publication states work.

[ ] Exam builder selects verified questions.

[ ] Exam preview uses the existing fullscreen exam interface.

[ ] Content reports link to the correct question.

[ ] Administrative actions generate demo audit events.

[ ] Audit filters and event details work.

[ ] Finance and license interfaces are coherent.

[ ] Technical monitoring clearly identifies unavailable backend integrations.

[ ] No fake payments or real email sends are claimed.

[ ] No plaintext passwords, secrets, or private tokens are exposed.

[ ] Admin interactions are accessible.

[ ] Mobile layouts remain usable.

[ ] The current application still builds successfully.

---

# 35. IMPLEMENTATION APPROACH

First inspect the entire existing QazMind frontend.

Identify:
- Existing routes
- Existing layouts
- Existing UI components
- Existing role model
- Existing user data structures
- Existing school service
- Existing question types
- Existing lesson components
- Existing exam engine

Create a short internal implementation plan.

Then implement the admin system incrementally.

Recommended implementation sequence:

1. Admin layout, sidebar, topbar, routing.
2. Shared tables, filters, dialogs, form components.
3. Admin dashboard.
4. User management.
5. School and teacher management.
6. Subject and lesson CMS.
7. Question bank and question editor.
8. Question import and review.
9. Exam builder.
10. Assignments.
11. Platform activity and audit logs.
12. Analytics.
13. Support and content reports.
14. Finance and licensing.
15. Monitoring, roles, notifications, settings.
16. Integration testing and responsive refinement.

Do not stop after implementing only the first dashboard screen.

Deliver the complete frontend experience with connected demo workflows.

Avoid touching existing student-facing components unnecessarily.

If an existing component can be reused safely, reuse it.

If a feature requires backend support, implement the frontend contract and honest prototype states without pretending the server exists.

---

# FINAL QUALITY STANDARD

QazMind Admin must feel like a serious production-oriented educational SaaS administration product.

The owner should be able to understand the platform's operational state.

Content managers should be able to create lessons and questions.

Reviewers should be able to verify educational content.

Support staff should be able to handle user problems.

School administrators should remain isolated within their own organizations.

Platform administrators should be able to inspect authorized activity, manage resources, and understand administrative changes.

The experience must be:

- Minimal
- Professional
- Beautiful
- Functional
- Consistent
- Secure by design
- Easy to extend
- Ready for backend integration

**DO NOT GENERATE A GENERIC ADMIN DASHBOARD.**

**DO NOT IMPLEMENT ONLY STATIC VISUAL MOCKUPS.**

**DO NOT REBUILD THE EXISTING QAZMIND APPLICATION.**

Build a complete, cohesive, API-ready QazMind Admin frontend that integrates into the existing application and provides realistic interactive management workflows.

Prioritize functionality, thoughtful product design, and maintainable architecture over decorative visual complexity.