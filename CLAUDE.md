# QazMind — project guide for Claude Code

Full specification: `docs/QAZMIND_TECHNICAL_SPEC.md` (read this before changes).

## Mission
Convert the existing QazMind React/Vite prototype into a real EdTech SaaS using FastAPI/PostgreSQL **without redesigning the existing frontend**. Keep Personal, Schools, Teacher, Platform Admin and fullscreen Focus Mode consistent. Implement in small, testable increments.

## Existing app
- Frontend: React 19, TypeScript, Vite, Tailwind CSS 4, existing `src/components/*`.
- Core routing/state currently concentrated in `src/App.tsx`.
- School demo data and local mutations are in `src/services/schoolService.ts`.
- Existing focus experiences in `src/components/focus/` must be preserved.
- Existing curriculum and demo questions in `src/content/` require migration to reviewed server-side content.
- Do not assume auth, school invitations or exam grading is production ready.

## Non-negotiable rules
1. No wholesale frontend rewrite or Next.js migration. Do not modify visual design except necessary integration states/bugs.
2. Never treat localStorage, hardcoded teachers, demo organization IDs, URL query parameters, or client-side roles as authority.
3. Never commit secrets or put correct exam answer keys in active exam responses.
4. RBAC and organization/class ownership are verified on the server on every protected request.
5. Do not fabricate student stats, results, email delivery, school approval, question content, or 140-point exams from incomplete demos.
6. Server persistence and migrations are authoritative; old local demo data are not real user accounts.
7. Keep student personal progress separate from school assignment results; do not erase either by changing subjects/school.
8. Preserve full-viewport focus flows without normal sidebar/mobile bottom nav.
9. If external service credentials are missing, implement a proper adapter and a clearly labeled local development mode. Never claim production integration works.
10. For each task, add/adjust tests, run relevant checks, document changes, and commit a single logical unit.

## Workflow per task
- Read the full spec and inspect relevant files.
- Report a concise plan and affected files.
- Implement only the requested phase, including DB migration/API/frontend wiring as applicable.
- Add unit/integration/E2E coverage for success and authorization failures.
- Run at least frontend `npm run lint` and `npm run build` (or equivalent) plus backend tests as soon as backend exists.
- Summarize tests, modified files, incomplete external dependencies, security/compatibility concerns, and next task.
- Do not proceed to unrelated product features or arbitrary UI redesigns.

## Phase order
0. Existing frontend baseline and tooling
1. FastAPI, PostgreSQL, SQLAlchemy, Alembic, Docker Compose
2. Real email auth, sessions, protected routes
3. Persist onboarding and personal profiles
4. Reviewed curriculum/lessons and lesson progress
5. Practice question engine and server evaluation
6. School organizations, memberships, classes and permissions
7. Invitations, join codes, teacher membership and licensing
8. Teacher assignments and end-to-end student submissions
9. Full mock exam, only after verified bank and official specification coverage
10. Real analytics, content admin, compliance and pilot quality checks

## First task
Only do phase 0 unless explicitly instructed otherwise: inventory the existing frontend, run typecheck/build/tests, document exact broken flows, record UI baselines, and prepare non-disruptive architecture decisions. Do not add new features.
