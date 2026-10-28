"""A school's own questions.

They belong to one organization, are visible only to its administrators and teachers, and can be used only in that
school's assignments. They never enter the platform bank, practice, or another school. Nobody reviews them:
the school answers for its own content. A question that already went into a published assignment cannot be
edited (students may have answered it); it can be archived and replaced.
"""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentDep, get_db
from app.api.v1.admin.questions import QuestionIn, _apply, _validate
from app.core.errors import AppError
from app.core.time import utcnow
from app.models import Assignment, AssignmentQuestion, OrganizationMember, Question, User
from app.services.school import SchoolService

router = APIRouter(tags=["school-questions"])

MAX_IMPORT = 200


def _service(db: Annotated[AsyncSession, Depends(get_db)]) -> SchoolService:
    return SchoolService(db)


SchoolDep = Annotated[SchoolService, Depends(_service)]


def _out(q: Question, author: str, member: OrganizationMember, used: int) -> dict:
    mine = q.author_user_id == member.user_id
    return {
        "id": str(q.id),
        "subject_id": q.subject_id,
        "difficulty": q.difficulty,
        "points": q.points,
        "text_ru": q.text_ru,
        "text_kz": q.text_kz,
        "options": q.options,
        "correct_label": q.correct_label,
        "explanation_ru": q.explanation_ru,
        "explanation_kz": q.explanation_kz,
        "status": "archived" if q.status == "school_archived" else "active",
        "author": author,
        "mine": mine,
        "used_in_assignments": used,
        "can_manage": mine or member.role == "SCHOOL_ADMIN",
        "created_at": q.created_at,
        "updated_at": q.updated_at,
    }


async def _used(db: AsyncSession, question_ids: list[uuid.UUID]) -> dict[uuid.UUID, int]:
    if not question_ids:
        return {}
    rows = await db.execute(
        select(AssignmentQuestion.question_id, func.count(func.distinct(AssignmentQuestion.assignment_id)))
        .where(AssignmentQuestion.question_id.in_(question_ids))
        .group_by(AssignmentQuestion.question_id)
    )
    return dict(rows.all())


async def _drafts_using(db: AsyncSession, question_id: uuid.UUID) -> bool:
    found = await db.scalar(
        select(Assignment.id).where(Assignment.status == "draft", Assignment.school_question_ids.contains([str(question_id)])).limit(1)
    )
    return found is not None


async def _own(db: AsyncSession, org_id: uuid.UUID, question_id: uuid.UUID, member: OrganizationMember, manage: bool) -> Question:
    question = await db.get(Question, question_id)
    if question is None or question.organization_id != org_id:
        raise AppError(404, "QUESTION_NOT_FOUND", "Вопрос не найден")
    if manage and member.role != "SCHOOL_ADMIN" and question.author_user_id != member.user_id:
        raise AppError(403, "FORBIDDEN", "Изменять вопрос может его автор или администратор школы")
    return question


@router.get("/organizations/{org_id}/questions")
async def list_questions(
    org_id: uuid.UUID,
    ctx: CurrentDep,
    school: SchoolDep,
    subject_id: str | None = None,
    status: Literal["active", "archived", "all"] = "active",
    search: str = Query(default="", max_length=100),
) -> dict:
    _, member = await school.member_of(ctx.user.id, org_id)
    query = select(Question, User.name).join(User, User.id == Question.author_user_id).where(Question.organization_id == org_id)
    if subject_id:
        query = query.where(Question.subject_id == subject_id)
    if status != "all":
        query = query.where(Question.status == ("school" if status == "active" else "school_archived"))
    if search.strip():
        query = query.where(func.lower(Question.text_ru).like(f"%{search.strip().lower()}%"))
    rows = (await school.db.execute(query.order_by(Question.updated_at.desc()).limit(500))).all()
    used = await _used(school.db, [q.id for q, _ in rows])
    return {"items": [_out(q, name, member, used.get(q.id, 0)) for q, name in rows]}


def _new(body: QuestionIn, org_id: uuid.UUID, user_id: uuid.UUID) -> Question:
    question = Question(
        status="school",
        organization_id=org_id,
        author_user_id=user_id,
        created_at=utcnow(),
        version=1,
        type="single_choice",
    )
    _apply(question, body.model_copy(update={"topic_id": None, "external_id": None, "source_reference": ""}))
    return question


@router.post("/organizations/{org_id}/questions", status_code=201)
async def create_question(org_id: uuid.UUID, body: QuestionIn, ctx: CurrentDep, school: SchoolDep) -> dict:
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    await _validate(school.db, body)
    question = _new(body, org_id, ctx.user.id)
    school.db.add(question)
    await school.db.commit()
    return _out(question, ctx.user.name, member, 0)


class ImportIn(BaseModel):
    rows: list[QuestionIn] = Field(min_length=1, max_length=MAX_IMPORT)


@router.post("/organizations/{org_id}/questions/import", status_code=201)
async def import_questions(org_id: uuid.UUID, body: ImportIn, ctx: CurrentDep, school: SchoolDep) -> dict:
    """All rows or none: the first invalid row is reported with its number and nothing is saved."""
    organization, _ = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    for number, row in enumerate(body.rows, start=1):
        try:
            await _validate(school.db, row)
        except AppError as error:
            raise AppError(422, error.code, f"Строка {number}: {error.message}") from None
    for row in body.rows:
        school.db.add(_new(row, org_id, ctx.user.id))
    await school.db.commit()
    return {"created": len(body.rows)}


@router.put("/organizations/{org_id}/questions/{question_id}")
async def update_question(org_id: uuid.UUID, question_id: uuid.UUID, body: QuestionIn, ctx: CurrentDep, school: SchoolDep) -> dict:
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    question = await _own(school.db, org_id, question_id, member, manage=True)
    used = (await _used(school.db, [question.id])).get(question.id, 0)
    if used:
        raise AppError(
            409,
            "QUESTION_IN_USE",
            "Вопрос уже входит в опубликованное задание, менять его нельзя. Отправьте его в архив и создайте новый.",
        )
    await _validate(school.db, body)
    _apply(question, body.model_copy(update={"topic_id": None, "external_id": None, "source_reference": ""}))
    question.version += 1
    question.updated_at = utcnow()
    await school.db.commit()
    return _out(question, ctx.user.name, member, 0)


@router.post("/organizations/{org_id}/questions/{question_id}/archive")
async def archive_question(org_id: uuid.UUID, question_id: uuid.UUID, ctx: CurrentDep, school: SchoolDep) -> dict:
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    question = await _own(school.db, org_id, question_id, member, manage=True)
    question.status = "school_archived"
    question.updated_at = utcnow()
    await school.db.commit()
    return {"status": "archived"}


@router.post("/organizations/{org_id}/questions/{question_id}/restore")
async def restore_question(org_id: uuid.UUID, question_id: uuid.UUID, ctx: CurrentDep, school: SchoolDep) -> dict:
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    question = await _own(school.db, org_id, question_id, member, manage=True)
    question.status = "school"
    question.updated_at = utcnow()
    await school.db.commit()
    return {"status": "active"}


@router.delete("/organizations/{org_id}/questions/{question_id}", status_code=204)
async def delete_question(org_id: uuid.UUID, question_id: uuid.UUID, ctx: CurrentDep, school: SchoolDep) -> None:
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    question = await _own(school.db, org_id, question_id, member, manage=True)
    if (await _used(school.db, [question.id])).get(question.id) or await _drafts_using(school.db, question.id):
        raise AppError(409, "QUESTION_IN_USE", "Вопрос используется в заданиях: его можно только отправить в архив")
    await school.db.delete(question)
    await school.db.commit()
