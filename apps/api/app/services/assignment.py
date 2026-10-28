import random
import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.time import utcnow
from app.models import (
    Assignment,
    AssignmentAnswer,
    AssignmentAttempt,
    AssignmentClass,
    AssignmentQuestion,
    ClassMember,
    Organization,
    OrganizationMember,
    Question,
    SchoolClass,
    Subject,
    User,
)
from app.schemas.assignment import (
    AssignmentIn,
    AssignmentOut,
    AttemptOut,
    AttemptQuestion,
    AttemptReview,
    MyAssignmentOut,
    MyAttemptSummary,
    ResultRow,
    ResultsOut,
)
from app.schemas.practice import OptionOut, PracticeQuestionOut

CLOSED = ("closed", "archived")


def _question_out(q: Question) -> PracticeQuestionOut:
    return PracticeQuestionOut(
        id=q.id,
        difficulty=q.difficulty,
        text_ru=q.text_ru,
        text_kz=q.text_kz,
        options=[OptionOut(label=o["label"], text_ru=o["text_ru"], text_kz=o.get("text_kz", "")) for o in q.options],
    )


def _not_found() -> AppError:
    return AppError(404, "NOT_FOUND", "Задание не найдено")


class AssignmentService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ----- teacher / school side ----------------------------------------------------------------------------

    async def _allowed_classes(self, org_id: uuid.UUID, member: OrganizationMember) -> set[uuid.UUID]:
        """Classes this person may give assignments to: every class for an administrator, assigned ones for a teacher."""
        if member.role == "SCHOOL_ADMIN":
            rows = await self.db.execute(select(SchoolClass.id).where(SchoolClass.organization_id == org_id))
        else:
            rows = await self.db.execute(
                select(ClassMember.class_id)
                .join(SchoolClass, SchoolClass.id == ClassMember.class_id)
                .where(
                    SchoolClass.organization_id == org_id,
                    ClassMember.user_id == member.user_id,
                    ClassMember.role == "teacher",
                    ClassMember.status == "active",
                )
            )
        return set(rows.scalars())

    async def _class_ids(self, assignment_id: uuid.UUID) -> list[uuid.UUID]:
        rows = await self.db.execute(select(AssignmentClass.class_id).where(AssignmentClass.assignment_id == assignment_id))
        return sorted(rows.scalars())

    async def _out(self, assignment: Assignment) -> AssignmentOut:
        creator = await self.db.get(User, assignment.created_by_user_id)
        submitted = (
            await self.db.scalar(
                select(func.count(func.distinct(AssignmentAttempt.student_id))).where(
                    AssignmentAttempt.assignment_id == assignment.id, AssignmentAttempt.submitted_at.is_not(None)
                )
            )
            or 0
        )
        return AssignmentOut(
            id=assignment.id,
            title=assignment.title,
            subject_id=assignment.subject_id,
            question_count=assignment.question_count,
            class_ids=await self._class_ids(assignment.id),
            due_at=assignment.due_at,
            max_attempts=assignment.max_attempts,
            score_policy=assignment.score_policy,
            reveal=assignment.reveal,
            status=assignment.status,
            created_by=creator.name if creator else "",
            created_at=assignment.created_at,
            published_at=assignment.published_at,
            closed_at=assignment.closed_at,
            submitted_count=submitted,
        )

    async def _load(self, org_id: uuid.UUID, assignment_id: uuid.UUID, member: OrganizationMember) -> Assignment:
        """An assignment of this organization that the caller may see; anything else is 'not found'."""
        assignment = await self.db.get(Assignment, assignment_id)
        if assignment is None or assignment.organization_id != org_id:
            raise _not_found()
        if member.role != "SCHOOL_ADMIN":
            allowed = await self._allowed_classes(org_id, member)
            if not allowed & set(await self._class_ids(assignment_id)):
                raise _not_found()
        return assignment

    def _require_owner(self, assignment: Assignment, member: OrganizationMember) -> None:
        if member.role != "SCHOOL_ADMIN" and assignment.created_by_user_id != member.user_id:
            raise AppError(403, "FORBIDDEN", "Изменять задание может его автор или администратор школы")

    async def _checked_classes(self, org_id: uuid.UUID, member: OrganizationMember, class_ids: list[uuid.UUID]) -> list[uuid.UUID]:
        wanted = set(class_ids)
        if not wanted <= await self._allowed_classes(org_id, member):
            raise AppError(404, "NOT_FOUND", "Класс не найден")
        active = set(
            (await self.db.execute(select(SchoolClass.id).where(SchoolClass.id.in_(wanted), SchoolClass.status == "active"))).scalars()
        )
        if active != wanted:
            raise AppError(409, "CLASS_ARCHIVED", "Задание нельзя назначить классу в архиве")
        return sorted(wanted)

    async def _check_subject_and_due(self, body: AssignmentIn) -> None:
        if await self.db.get(Subject, body.subject_id) is None:
            raise AppError(404, "SUBJECT_NOT_FOUND", "Предмет не найден")
        if body.due_at is not None and body.due_at <= utcnow():
            raise AppError(422, "DUE_IN_PAST", "Срок сдачи должен быть в будущем")

    async def create(self, org_id: uuid.UUID, member: OrganizationMember, body: AssignmentIn) -> AssignmentOut:
        await self._check_subject_and_due(body)
        class_ids = await self._checked_classes(org_id, member, body.class_ids)
        assignment = Assignment(
            organization_id=org_id,
            created_by_user_id=member.user_id,
            title=body.title,
            subject_id=body.subject_id,
            question_count=body.question_count,
            due_at=body.due_at,
            max_attempts=body.max_attempts,
            score_policy=body.score_policy,
            reveal=body.reveal,
        )
        self.db.add(assignment)
        await self.db.flush()
        for class_id in class_ids:
            self.db.add(AssignmentClass(assignment_id=assignment.id, class_id=class_id))
        await self.db.commit()
        return await self._out(assignment)

    async def update(self, org_id: uuid.UUID, assignment_id: uuid.UUID, member: OrganizationMember, body: AssignmentIn) -> AssignmentOut:
        assignment = await self._load(org_id, assignment_id, member)
        self._require_owner(assignment, member)
        if assignment.status != "draft":
            raise AppError(409, "NOT_A_DRAFT", "Изменять можно только черновик")
        await self._check_subject_and_due(body)
        class_ids = await self._checked_classes(org_id, member, body.class_ids)
        for field in ("title", "subject_id", "question_count", "due_at", "max_attempts", "score_policy", "reveal"):
            setattr(assignment, field, getattr(body, field))
        existing = set(await self._class_ids(assignment.id))
        for link in (await self.db.execute(select(AssignmentClass).where(AssignmentClass.assignment_id == assignment.id))).scalars():
            if link.class_id not in class_ids:
                await self.db.delete(link)
        for class_id in set(class_ids) - existing:
            self.db.add(AssignmentClass(assignment_id=assignment.id, class_id=class_id))
        await self.db.commit()
        return await self._out(assignment)

    async def list_for(self, org_id: uuid.UUID, member: OrganizationMember) -> list[AssignmentOut]:
        rows = (
            await self.db.execute(select(Assignment).where(Assignment.organization_id == org_id).order_by(Assignment.created_at.desc()))
        ).scalars().all()
        allowed = None if member.role == "SCHOOL_ADMIN" else await self._allowed_classes(org_id, member)
        out = []
        for assignment in rows:
            if allowed is not None and not allowed & set(await self._class_ids(assignment.id)):
                continue
            out.append(await self._out(assignment))
        return out

    async def get(self, org_id: uuid.UUID, assignment_id: uuid.UUID, member: OrganizationMember) -> AssignmentOut:
        return await self._out(await self._load(org_id, assignment_id, member))

    async def publish(self, org_id: uuid.UUID, assignment_id: uuid.UUID, member: OrganizationMember) -> AssignmentOut:
        assignment = await self._load(org_id, assignment_id, member)
        self._require_owner(assignment, member)
        if assignment.status != "draft":
            raise AppError(409, "NOT_A_DRAFT", "Опубликовать можно только черновик")
        if assignment.due_at is not None and assignment.due_at <= utcnow():
            raise AppError(422, "DUE_IN_PAST", "Срок сдачи уже прошёл: измените его в черновике")
        await self._checked_classes(org_id, member, await self._class_ids(assignment.id))
        published = list(
            (
                await self.db.execute(
                    select(Question.id).where(Question.subject_id == assignment.subject_id, Question.status == "published")
                )
            ).scalars()
        )
        if len(published) < assignment.question_count:
            raise AppError(
                409,
                "NOT_ENOUGH_QUESTIONS",
                f"По предмету опубликовано заданий: {len(published)}, а нужно {assignment.question_count}. "
                "Задание нельзя составить без проверенного контента.",
            )
        picked = random.sample(published, assignment.question_count)
        for position, question_id in enumerate(picked, start=1):
            self.db.add(AssignmentQuestion(assignment_id=assignment.id, question_id=question_id, position=position))
        assignment.status = "published"
        assignment.published_at = utcnow()
        await self.db.commit()
        return await self._out(assignment)

    async def close(self, org_id: uuid.UUID, assignment_id: uuid.UUID, member: OrganizationMember) -> AssignmentOut:
        assignment = await self._load(org_id, assignment_id, member)
        self._require_owner(assignment, member)
        if assignment.status != "published":
            raise AppError(409, "NOT_PUBLISHED", "Закрыть можно только опубликованное задание")
        assignment.status = "closed"
        assignment.closed_at = utcnow()
        # Attempts still in progress are submitted with the answers saved so far; past attempts are never rewritten.
        open_attempts = (
            await self.db.execute(
                select(AssignmentAttempt).where(AssignmentAttempt.assignment_id == assignment.id, AssignmentAttempt.submitted_at.is_(None))
            )
        ).scalars()
        for attempt in open_attempts:
            await self._submit(attempt, assignment)
        await self.db.commit()
        return await self._out(assignment)

    async def archive(self, org_id: uuid.UUID, assignment_id: uuid.UUID, member: OrganizationMember) -> AssignmentOut:
        assignment = await self._load(org_id, assignment_id, member)
        self._require_owner(assignment, member)
        if assignment.status not in ("draft", "closed"):
            raise AppError(409, "CANNOT_ARCHIVE", "В архив можно убрать черновик или закрытое задание")
        assignment.status = "archived"
        await self.db.commit()
        return await self._out(assignment)

    async def results(self, org_id: uuid.UUID, assignment_id: uuid.UUID, member: OrganizationMember) -> ResultsOut:
        assignment = await self._load(org_id, assignment_id, member)
        class_ids = await self._class_ids(assignment_id)
        if member.role != "SCHOOL_ADMIN":
            class_ids = [c for c in class_ids if c in await self._allowed_classes(org_id, member)]
        students = (
            await self.db.execute(
                select(User, SchoolClass)
                .join(ClassMember, ClassMember.user_id == User.id)
                .join(SchoolClass, SchoolClass.id == ClassMember.class_id)
                .where(ClassMember.class_id.in_(class_ids), ClassMember.role == "student", ClassMember.status == "active")
                .order_by(SchoolClass.name, User.name)
            )
        ).all()
        attempts: dict[uuid.UUID, list[AssignmentAttempt]] = {}
        for attempt in (
            await self.db.execute(
                select(AssignmentAttempt).where(AssignmentAttempt.assignment_id == assignment_id).order_by(AssignmentAttempt.number)
            )
        ).scalars():
            attempts.setdefault(attempt.student_id, []).append(attempt)
        rows: list[ResultRow] = []
        for user, school_class in students:
            mine = attempts.get(user.id, [])
            done = [a for a in mine if a.submitted_at is not None]
            best = max((a.score for a in done if a.score is not None), default=None)
            last = done[-1].score if done else None
            final = best if assignment.score_policy == "best" else last
            state = "submitted" if done else ("in_progress" if mine else "not_started")
            rows.append(
                ResultRow(
                    student_id=user.id,
                    name=user.name,
                    email=user.email,
                    class_id=school_class.id,
                    class_name=school_class.name,
                    state=state,
                    attempts=len(mine),
                    best_score=best,
                    last_score=last,
                    final_score=final,
                    max_score=done[-1].max_score if done else None,
                    last_submitted_at=done[-1].submitted_at if done else None,
                )
            )
        finals = [r.final_score for r in rows if r.final_score is not None]
        return ResultsOut(
            assignment=await self._out(assignment),
            score_policy=assignment.score_policy,
            rows=rows,
            submitted=sum(1 for r in rows if r.state == "submitted"),
            total_students=len(rows),
            average_final=round(sum(finals) / len(finals), 1) if finals else None,
        )

    # ----- student side -------------------------------------------------------------------------------------

    def _visible(self, assignment: Assignment, has_submitted: bool) -> bool:
        return has_submitted and (assignment.reveal == "after_submit" or assignment.status in CLOSED)

    def _final(self, assignment: Assignment, attempts: list[AssignmentAttempt]) -> tuple[int | None, int | None]:
        done = [a for a in attempts if a.submitted_at is not None]
        if not done:
            return None, None
        pick = max(done, key=lambda a: a.score or 0) if assignment.score_policy == "best" else done[-1]
        return pick.score, pick.max_score

    async def my_assignments(self, user_id: uuid.UUID) -> list[MyAssignmentOut]:
        rows = (
            await self.db.execute(
                select(Assignment, SchoolClass, Organization)
                .join(AssignmentClass, AssignmentClass.assignment_id == Assignment.id)
                .join(SchoolClass, SchoolClass.id == AssignmentClass.class_id)
                .join(ClassMember, ClassMember.class_id == SchoolClass.id)
                .join(Organization, Organization.id == Assignment.organization_id)
                .where(
                    ClassMember.user_id == user_id,
                    ClassMember.role == "student",
                    ClassMember.status == "active",
                    Assignment.status.in_(("published", "closed")),
                )
                .order_by(Assignment.created_at.desc())
            )
        ).all()
        seen: set[uuid.UUID] = set()
        out: list[MyAssignmentOut] = []
        now = utcnow()
        for assignment, school_class, organization in rows:
            if assignment.id in seen:
                continue  # one assignment given to two classes of the same student is listed once
            seen.add(assignment.id)
            attempts = list(
                (
                    await self.db.execute(
                        select(AssignmentAttempt)
                        .where(AssignmentAttempt.assignment_id == assignment.id, AssignmentAttempt.student_id == user_id)
                        .order_by(AssignmentAttempt.number)
                    )
                ).scalars()
            )
            open_attempt = next((a for a in attempts if a.submitted_at is None), None)
            has_submitted = any(a.submitted_at is not None for a in attempts)
            visible = self._visible(assignment, has_submitted)
            final, max_score = self._final(assignment, attempts)
            can_start = (
                assignment.status == "published"
                and open_attempt is None
                and len(attempts) < assignment.max_attempts
                and (assignment.due_at is None or assignment.due_at > now)
            )
            out.append(
                MyAssignmentOut(
                    id=assignment.id,
                    title=assignment.title,
                    subject_id=assignment.subject_id,
                    organization_name=organization.name,
                    class_name=school_class.name,
                    question_count=assignment.question_count,
                    due_at=assignment.due_at,
                    max_attempts=assignment.max_attempts,
                    score_policy=assignment.score_policy,
                    status=assignment.status,
                    attempts=[
                        MyAttemptSummary(
                            id=a.id,
                            number=a.number,
                            submitted=a.submitted_at is not None,
                            score=a.score if visible and a.submitted_at else None,
                            max_score=a.max_score if visible and a.submitted_at else None,
                        )
                        for a in attempts
                    ],
                    can_start=can_start,
                    in_progress_attempt_id=open_attempt.id if open_attempt else None,
                    final_score=final if visible else None,
                    max_score=max_score if visible else None,
                    result_visible=visible,
                )
            )
        return out

    async def _student_assignment(self, user_id: uuid.UUID, assignment_id: uuid.UUID) -> Assignment:
        assignment = await self.db.get(Assignment, assignment_id)
        if assignment is None or assignment.status not in ("published", "closed"):
            raise _not_found()
        member = await self.db.scalar(
            select(ClassMember.id)
            .join(AssignmentClass, AssignmentClass.class_id == ClassMember.class_id)
            .where(
                AssignmentClass.assignment_id == assignment_id,
                ClassMember.user_id == user_id,
                ClassMember.role == "student",
                ClassMember.status == "active",
            )
        )
        if member is None:
            raise _not_found()
        return assignment

    async def start(self, user_id: uuid.UUID, assignment_id: uuid.UUID) -> AttemptOut:
        assignment = await self._student_assignment(user_id, assignment_id)
        attempts = list(
            (
                await self.db.execute(
                    select(AssignmentAttempt).where(AssignmentAttempt.assignment_id == assignment_id, AssignmentAttempt.student_id == user_id)
                )
            ).scalars()
        )
        open_attempt = next((a for a in attempts if a.submitted_at is None), None)
        if open_attempt is not None:
            return await self._attempt_out(open_attempt, assignment)  # resume instead of starting a second one
        if assignment.status != "published":
            raise AppError(409, "ASSIGNMENT_CLOSED", "Задание закрыто")
        if assignment.due_at is not None and assignment.due_at <= utcnow():
            raise AppError(409, "DUE_PASSED", "Срок сдачи прошёл")
        if len(attempts) >= assignment.max_attempts:
            raise AppError(409, "NO_ATTEMPTS_LEFT", "Все попытки использованы")
        attempt = AssignmentAttempt(assignment_id=assignment_id, student_id=user_id, number=len(attempts) + 1)
        self.db.add(attempt)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "ATTEMPT_CONFLICT", "Попытка уже создаётся, обновите страницу") from None
        return await self._attempt_out(attempt, assignment)

    async def _own_attempt(self, user_id: uuid.UUID, attempt_id: uuid.UUID) -> tuple[AssignmentAttempt, Assignment]:
        attempt = await self.db.get(AssignmentAttempt, attempt_id)
        if attempt is None or attempt.student_id != user_id:
            raise AppError(404, "NOT_FOUND", "Попытка не найдена")
        assignment = await self.db.get(Assignment, attempt.assignment_id)
        return attempt, assignment  # type: ignore[return-value]

    async def _attempt_out(self, attempt: AssignmentAttempt, assignment: Assignment) -> AttemptOut:
        rows = (
            await self.db.execute(
                select(AssignmentQuestion.question_id)
                .where(AssignmentQuestion.assignment_id == assignment.id)
                .order_by(AssignmentQuestion.position)
            )
        ).scalars().all()
        questions = {q.id: q for q in (await self.db.execute(select(Question).where(Question.id.in_(rows)))).scalars()}
        answers = {
            a.question_id: a
            for a in (await self.db.execute(select(AssignmentAnswer).where(AssignmentAnswer.attempt_id == attempt.id))).scalars()
        }
        submitted = attempt.submitted_at is not None
        visible = self._visible(assignment, submitted)
        items = []
        for question_id in rows:
            q, a = questions[question_id], answers.get(question_id)
            review = None
            if visible:
                review = AttemptReview(
                    selected_label=a.selected_label if a else None,
                    correct_label=q.correct_label,
                    is_correct=bool(a and a.is_correct),
                    explanation_ru=q.explanation_ru,
                    explanation_kz=q.explanation_kz,
                )
            items.append(AttemptQuestion(question=_question_out(q), selected_label=a.selected_label if a else None, review=review))
        return AttemptOut(
            id=attempt.id,
            assignment_id=assignment.id,
            title=assignment.title,
            number=attempt.number,
            started_at=attempt.started_at,
            submitted_at=attempt.submitted_at,
            due_at=assignment.due_at,
            total=len(rows),
            answered=len(answers),
            score=attempt.score if visible else None,
            max_score=attempt.max_score if visible else None,
            result_visible=visible,
            items=items,
        )

    async def get_attempt(self, user_id: uuid.UUID, attempt_id: uuid.UUID) -> AttemptOut:
        attempt, assignment = await self._own_attempt(user_id, attempt_id)
        return await self._attempt_out(attempt, assignment)

    async def answer(self, user_id: uuid.UUID, attempt_id: uuid.UUID, question_id: uuid.UUID, label: str) -> None:
        attempt, assignment = await self._own_attempt(user_id, attempt_id)
        if attempt.submitted_at is not None:
            raise AppError(409, "ATTEMPT_SUBMITTED", "Попытка уже сдана")
        if assignment.status != "published":
            raise AppError(409, "ASSIGNMENT_CLOSED", "Задание закрыто")
        if assignment.due_at is not None and assignment.due_at <= utcnow():
            raise AppError(409, "DUE_PASSED", "Срок сдачи прошёл. Сдайте попытку с сохранёнными ответами.")
        in_assignment = await self.db.scalar(
            select(AssignmentQuestion.question_id).where(
                AssignmentQuestion.assignment_id == assignment.id, AssignmentQuestion.question_id == question_id
            )
        )
        question = await self.db.get(Question, question_id) if in_assignment else None
        if question is None:
            raise AppError(404, "QUESTION_NOT_IN_ASSIGNMENT", "Этого вопроса нет в задании")
        if label not in {o["label"] for o in question.options}:
            raise AppError(422, "INVALID_OPTION", "Такого варианта нет в вопросе")
        existing = await self.db.get(AssignmentAnswer, (attempt.id, question_id))
        correct = label == question.correct_label
        if existing is None:
            self.db.add(AssignmentAnswer(attempt_id=attempt.id, question_id=question_id, selected_label=label, is_correct=correct))
        else:
            # Until the attempt is submitted the student may change an answer; the key is never shown meanwhile.
            existing.selected_label, existing.is_correct, existing.answered_at = label, correct, utcnow()
        await self.db.commit()

    async def _submit(self, attempt: AssignmentAttempt, assignment: Assignment) -> None:
        points = dict(
            (
                await self.db.execute(
                    select(Question.id, Question.points)
                    .join(AssignmentQuestion, AssignmentQuestion.question_id == Question.id)
                    .where(AssignmentQuestion.assignment_id == assignment.id)
                )
            ).all()
        )
        correct = (
            await self.db.execute(
                select(AssignmentAnswer.question_id).where(AssignmentAnswer.attempt_id == attempt.id, AssignmentAnswer.is_correct.is_(True))
            )
        ).scalars()
        attempt.score = sum(points.get(q, 0) for q in correct)
        attempt.max_score = sum(points.values())
        attempt.submitted_at = utcnow()

    async def finish(self, user_id: uuid.UUID, attempt_id: uuid.UUID) -> AttemptOut:
        attempt, assignment = await self._own_attempt(user_id, attempt_id)
        if attempt.submitted_at is None:
            await self._submit(attempt, assignment)
            await self.db.commit()
        return await self._attempt_out(attempt, assignment)

