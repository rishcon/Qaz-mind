"""Question bank. Questions are created as drafts, reviewed by someone other than the author, then published.

The server validates every question: the subject exists, the topic belongs to it, the options are complete and
the correct answer is one of them. Imported rows go through the same validation; nothing is filled in.
"""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import func, or_, select

from app.admin.service import StaffContext, write_audit
from app.api.deps import get_db
from app.api.v1.admin.deps import MetaDep, StaffDep, require
from app.core.errors import AppError
from app.core.time import utcnow
from app.models import CurriculumTopic, Question, StaffMember, Subject

router = APIRouter(prefix="/questions", tags=["admin-questions"])

LABELS = ("A", "B", "C", "D", "E")

# action -> (required status, next status, permission)
TRANSITIONS = {
    "submit": ("draft", "in_review", "content.edit"),
    "return": ("in_review", "draft", "content.review"),
    "approve": ("in_review", "approved", "content.review"),
    "publish": ("approved", "published", "content.publish"),
    "archive": ("published", "archived", "content.publish"),
}
REVIEW_ACTIONS = frozenset({"approve", "publish"})


class OptionIn(BaseModel):
    label: Literal["A", "B", "C", "D", "E"]
    text_ru: str = Field(min_length=1, max_length=1000)
    text_kz: str = Field(default="", max_length=1000)


class QuestionIn(BaseModel):
    subject_id: str = Field(min_length=3, max_length=32)
    topic_id: uuid.UUID | None = None
    difficulty: Literal["easy", "medium", "hard"]
    points: int = Field(default=1, ge=1, le=5)
    text_ru: str = Field(min_length=3, max_length=4000)
    text_kz: str = Field(default="", max_length=4000)
    options: list[OptionIn] = Field(min_length=2, max_length=5)
    correct_label: Literal["A", "B", "C", "D", "E"]
    explanation_ru: str = Field(default="", max_length=4000)
    explanation_kz: str = Field(default="", max_length=4000)
    source_reference: str = Field(default="", max_length=300)
    external_id: str | None = Field(default=None, max_length=80)

    @field_validator("options")
    @classmethod
    def labels_in_order(cls, options: list[OptionIn]) -> list[OptionIn]:
        labels = [o.label for o in options]
        if labels != list(LABELS[: len(options)]):
            raise ValueError("варианты должны идти по порядку: A, B, C…")
        return options


async def _validate(db, body: QuestionIn) -> None:
    if await db.get(Subject, body.subject_id) is None:
        raise AppError(422, "SUBJECT_NOT_FOUND", f"Предмет «{body.subject_id}» не найден")
    if body.topic_id is not None:
        topic = await db.get(CurriculumTopic, body.topic_id)
        if topic is None or topic.subject_id != body.subject_id:
            raise AppError(422, "TOPIC_MISMATCH", "Тема не относится к выбранному предмету")
    if body.correct_label not in {o.label for o in body.options}:
        raise AppError(422, "CORRECT_NOT_IN_OPTIONS", "Правильный ответ должен быть одним из вариантов")


def _apply(question: Question, body: QuestionIn) -> None:
    question.subject_id = body.subject_id
    question.topic_id = body.topic_id
    question.difficulty = body.difficulty
    question.points = body.points
    question.text_ru = body.text_ru.strip()
    question.text_kz = body.text_kz.strip()
    question.options = [o.model_dump() for o in body.options]
    question.correct_label = body.correct_label
    question.explanation_ru = body.explanation_ru.strip()
    question.explanation_kz = body.explanation_kz.strip()
    question.source_reference = body.source_reference.strip()
    question.external_id = body.external_id


def _out(q: Question, author: str | None = None, reviewer: str | None = None) -> dict:
    return {
        "id": str(q.id),
        "subject_id": q.subject_id,
        "topic_id": str(q.topic_id) if q.topic_id else None,
        "type": q.type,
        "difficulty": q.difficulty,
        "points": q.points,
        "text_ru": q.text_ru,
        "text_kz": q.text_kz,
        "options": q.options,
        "correct_label": q.correct_label,
        "explanation_ru": q.explanation_ru,
        "explanation_kz": q.explanation_kz,
        "source_reference": q.source_reference,
        "external_id": q.external_id,
        "status": q.status,
        "review_notes": q.review_notes,
        "author": author,
        "reviewer": reviewer,
        "version": q.version,
        "created_at": q.created_at,
        "updated_at": q.updated_at,
        "published_at": q.published_at,
    }


async def _emails(db, ids: set[uuid.UUID]) -> dict[uuid.UUID, str]:
    if not ids:
        return {}
    rows = (await db.execute(select(StaffMember.id, StaffMember.email).where(StaffMember.id.in_(ids)))).all()
    return dict(rows)


@router.get("")
async def list_questions(
    ctx: StaffDep,
    db=Depends(get_db),
    subject_id: str | None = None,
    status: str | None = None,
    search: str = "",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
) -> dict:
    query = select(Question)
    if subject_id:
        query = query.where(Question.subject_id == subject_id)
    if status:
        query = query.where(Question.status == status)
    if search.strip():
        pattern = f"%{search.strip().lower()}%"
        query = query.where(or_(func.lower(Question.text_ru).like(pattern), func.lower(Question.external_id).like(pattern)))
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    rows = (
        await db.execute(query.order_by(Question.updated_at.desc()).offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()
    emails = await _emails(db, {q.author_staff_id for q in rows} | {q.reviewer_staff_id for q in rows if q.reviewer_staff_id})
    return {
        "items": [_out(q, emails.get(q.author_staff_id), emails.get(q.reviewer_staff_id)) for q in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


async def _question(db, question_id: uuid.UUID) -> Question:
    question = await db.get(Question, question_id)
    if question is None:
        raise AppError(404, "QUESTION_NOT_FOUND", "Вопрос не найден")
    return question


@router.get("/{question_id}")
async def get_question(question_id: uuid.UUID, ctx: StaffDep, db=Depends(get_db)) -> dict:
    q = await _question(db, question_id)
    emails = await _emails(db, {q.author_staff_id} | ({q.reviewer_staff_id} if q.reviewer_staff_id else set()))
    return _out(q, emails.get(q.author_staff_id), emails.get(q.reviewer_staff_id))


@router.post("", status_code=201)
async def create_question(
    body: QuestionIn,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("content.create"))],
    db=Depends(get_db),
) -> dict:
    await _validate(db, body)
    question = Question(status="draft", author_staff_id=ctx.staff.id, created_at=utcnow(), version=1, type="single_choice")
    _apply(question, body)
    db.add(question)
    await db.flush()
    await write_audit(db, ctx, "question.created", meta, "question", str(question.id))
    await db.commit()
    return {"id": str(question.id)}


@router.put("/{question_id}")
async def update_question(
    question_id: uuid.UUID,
    body: QuestionIn,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("content.edit"))],
    db=Depends(get_db),
) -> dict:
    question = await _question(db, question_id)
    if question.status != "draft":
        raise AppError(409, "NOT_EDITABLE", "Редактировать можно только черновик. Верните вопрос на доработку.")
    await _validate(db, body)
    _apply(question, body)
    question.version += 1
    question.updated_at = utcnow()
    await write_audit(db, ctx, "question.updated", meta, "question", str(question.id), details={"version": question.version})
    await db.commit()
    return {"id": str(question.id), "version": question.version}


class TransitionIn(BaseModel):
    action: Literal["submit", "return", "approve", "publish", "archive"]
    notes: str = Field(default="", max_length=2000)


@router.post("/{question_id}/transition")
async def transition(
    question_id: uuid.UUID,
    body: TransitionIn,
    meta: MetaDep,
    ctx: StaffDep,
    db=Depends(get_db),
) -> dict:
    required, target, permission = TRANSITIONS[body.action]
    ctx.require(permission)
    question = await _question(db, question_id)
    if question.status != required:
        raise AppError(409, "WORKFLOW_RULE", f"Действие возможно только из статуса «{required}», сейчас «{question.status}»")
    if body.action in REVIEW_ACTIONS and question.author_staff_id == ctx.staff.id:
        raise AppError(409, "OWN_MATERIAL", "Автор не может утверждать или публиковать свой вопрос")
    if body.action == "return" and not body.notes.strip():
        raise AppError(422, "NOTES_REQUIRED", "Укажите замечания для автора")
    question.status = target
    if body.action in ("approve", "return"):
        question.reviewer_staff_id = ctx.staff.id
        question.review_notes = body.notes.strip()
    if body.action == "publish":
        question.published_at = utcnow()
    question.updated_at = utcnow()
    await write_audit(db, ctx, f"question.{body.action}", meta, "question", str(question.id),
                      details={"status": target, "notes": body.notes.strip()})
    await db.commit()
    return {"status": question.status}


class ImportIn(BaseModel):
    rows: list[QuestionIn] = Field(min_length=1, max_length=500)


@router.post("/import", status_code=201)
async def import_questions(
    body: ImportIn,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("content.create"))],
    db=Depends(get_db),
) -> dict:
    # All rows or none: a file with one invalid row is rejected as a whole, with the row number.
    for index, row in enumerate(body.rows, start=1):
        try:
            await _validate(db, row)
        except AppError as error:
            raise AppError(error.status_code, error.code, f"Строка {index}: {error.message}") from error
    external_ids = [r.external_id for r in body.rows if r.external_id]
    if external_ids:
        taken = (await db.execute(select(Question.external_id).where(Question.external_id.in_(external_ids)))).scalars().all()
        if taken:
            raise AppError(409, "DUPLICATE_EXTERNAL_ID", f"Эти ID уже есть в банке: {', '.join(sorted(set(taken)))}")
    created = []
    for row in body.rows:
        question = Question(status="draft", author_staff_id=ctx.staff.id, created_at=utcnow(), version=1, type="single_choice")
        _apply(question, row)
        db.add(question)
        created.append(question)
    await db.flush()
    await write_audit(db, ctx, "question.imported", meta, "question", None, details={"count": len(created)})
    await db.commit()
    return {"created": len(created)}
