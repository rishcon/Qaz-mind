"""Question bank. Questions are created as drafts, reviewed by someone other than the author, then published.

The server validates every question: the subject exists, the topic belongs to it, the options are complete and
the correct answer is one of them. Imported rows go through the same validation; nothing is filled in.
"""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import delete, func, or_, select

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


def _blocked_as_author(ctx: StaffContext, question: Question, action: str) -> bool:
    """The author cannot approve or publish their own question. The platform owner can do everything."""
    return action in REVIEW_ACTIONS and question.author_staff_id == ctx.staff.id and "OWNER" not in ctx.roles


def _move(ctx: StaffContext, question: Question, action: str, notes: str) -> None:
    now = utcnow()
    question.status = TRANSITIONS[action][1]
    if action in ("approve", "return"):
        question.reviewer_staff_id = ctx.staff.id
        question.review_notes = notes
    if action == "publish":
        question.published_at = now
    question.updated_at = now


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
        texts = [" ".join(o.text_ru.lower().split()) for o in options]
        if len(set(texts)) != len(texts):
            raise ValueError("варианты ответа не должны повторяться")
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


def _filtered(subject_id: str | None, status: str | None, search: str):
    # A school's own questions are private to that school and never appear in the platform bank.
    query = select(Question).where(Question.organization_id.is_(None))
    if subject_id:
        query = query.where(Question.subject_id == subject_id)
    if status:
        query = query.where(Question.status == status)
    if search.strip():
        pattern = f"%{search.strip().lower()}%"
        query = query.where(or_(func.lower(Question.text_ru).like(pattern), func.lower(Question.external_id).like(pattern)))
    return query


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
    query = _filtered(subject_id, status, search)
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
    if question is None or question.organization_id is not None:
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
    if _blocked_as_author(ctx, question, body.action):
        raise AppError(409, "OWN_MATERIAL", "Автор не может утверждать или публиковать свой вопрос")
    if body.action == "return" and not body.notes.strip():
        raise AppError(422, "NOTES_REQUIRED", "Укажите замечания для автора")
    _move(ctx, question, body.action, body.notes.strip())
    await write_audit(db, ctx, f"question.{body.action}", meta, "question", str(question.id),
                      details={"status": target, "notes": body.notes.strip()})
    await db.commit()
    return {"status": question.status}


class ImportIn(BaseModel):
    rows: list[QuestionIn] = Field(min_length=1, max_length=500)


def _norm(text: str) -> str:
    return " ".join(text.lower().split())


async def _check_import(db, rows: list[QuestionIn]) -> tuple[list[dict], list[dict]]:
    """Checks every row of an import file. Errors stop the import; warnings are shown to the person who imports.

    Imports are stricter than the editor: a question must carry its external_id (so a file can be loaded only once)
    and its source, so a reviewer can find where it came from.
    """
    errors: list[dict] = []
    warnings: list[dict] = []
    subjects = {r.subject_id for r in rows}
    existing_text = {
        _norm(t)
        for t in (
            await db.execute(select(Question.text_ru).where(Question.subject_id.in_(subjects), Question.status != "archived", Question.organization_id.is_(None)))
        ).scalars()
    }
    ids = [r.external_id for r in rows if r.external_id]
    taken = set((await db.execute(select(Question.external_id).where(Question.external_id.in_(ids), Question.organization_id.is_(None)))).scalars()) if ids else set()
    seen_ids: dict[str, int] = {}
    seen_text: dict[str, int] = {}

    for n, row in enumerate(rows, start=1):
        try:
            await _validate(db, row)
        except AppError as error:
            errors.append({"row": n, "message": error.message})
        if not row.external_id:
            errors.append({"row": n, "message": "не указан external_id"})
        else:
            if row.external_id.upper().startswith("EXAMPLE"):
                errors.append({"row": n, "message": "это пример из документации, его нельзя загружать"})
            if row.external_id in taken:
                errors.append({"row": n, "message": f"ID «{row.external_id}» уже есть в банке"})
            if row.external_id in seen_ids:
                errors.append({"row": n, "message": f"ID «{row.external_id}» повторяет строку {seen_ids[row.external_id]}"})
            else:
                seen_ids[row.external_id] = n
        if not row.source_reference.strip():
            errors.append({"row": n, "message": "не указан источник (source)"})

        key = _norm(row.text_ru)
        if key in existing_text:
            warnings.append({"row": n, "message": "такой текст вопроса уже есть в банке"})
        if key in seen_text:
            warnings.append({"row": n, "message": f"текст повторяет строку {seen_text[key]}"})
        seen_text.setdefault(key, n)
        if not row.text_kz.strip() or any(not o.text_kz.strip() for o in row.options):
            warnings.append({"row": n, "message": "нет казахской версии вопроса или вариантов"})
        if not row.explanation_ru.strip():
            warnings.append({"row": n, "message": "нет пояснения"})
    return errors, warnings


@router.post("/import")
async def import_questions(
    body: ImportIn,
    meta: MetaDep,
    response: Response,
    ctx: Annotated[StaffContext, Depends(require("content.create"))],
    dry_run: bool = Query(False),
    db=Depends(get_db),
) -> dict:
    errors, warnings = await _check_import(db, body.rows)
    if dry_run:
        bad_rows = {e["row"] for e in errors}
        return {"dry_run": True, "valid": len(body.rows) - len(bad_rows), "errors": errors, "warnings": warnings}
    # All rows or none: a file with one invalid row is rejected as a whole, with the row number.
    if errors:
        first = errors[0]
        raise AppError(422, "IMPORT_REJECTED", f"Строка {first['row']}: {first['message']} (всего ошибок: {len(errors)})")
    response.status_code = 201
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


class BulkFilter(BaseModel):
    subject_id: str | None = None
    status: str | None = None
    search: str = ""


class BulkIn(BaseModel):
    """Either an explicit list of questions or the filter the person is looking at ("all questions found")."""

    action: Literal["submit", "return", "approve", "publish", "archive", "delete"]
    notes: str = Field(default="", max_length=2000)
    ids: list[uuid.UUID] | None = Field(default=None, max_length=5000)
    filter: BulkFilter | None = None


@router.post("/bulk")
async def bulk(
    body: BulkIn,
    meta: MetaDep,
    ctx: StaffDep,
    db=Depends(get_db),
) -> dict:
    """Applies one workflow action to many questions. Each question follows the same rules as a single one: a question
    in the wrong status, or one the person may not approve (their own, unless they are the owner), is skipped and
    counted, never touched. Delete is only for drafts: a question that was reviewed or published is archived."""
    ctx.require("content.edit" if body.action == "delete" else TRANSITIONS[body.action][2])
    if (body.ids is None) == (body.filter is None):
        raise AppError(422, "BULK_SCOPE", "Укажите либо список вопросов, либо фильтр")
    if body.ids is not None:
        if not body.ids:
            raise AppError(422, "BULK_SCOPE", "Список вопросов пуст")
        query = select(Question).where(Question.id.in_(body.ids), Question.organization_id.is_(None))
    else:
        query = _filtered(body.filter.subject_id, body.filter.status, body.filter.search)
    if body.action == "return" and not body.notes.strip():
        raise AppError(422, "NOTES_REQUIRED", "Укажите замечания для автора")

    selected = (await db.execute(query)).scalars().all()
    required = "draft" if body.action == "delete" else TRANSITIONS[body.action][0]
    eligible = [q for q in selected if q.status == required and not _blocked_as_author(ctx, q, body.action)]
    if body.action == "delete":
        ids = [q.id for q in eligible]
        for start in range(0, len(ids), 1000):
            await db.execute(delete(Question).where(Question.id.in_(ids[start : start + 1000]), Question.status == "draft"))
    else:
        for q in eligible:
            _move(ctx, q, body.action, body.notes.strip())
    done = len(eligible)
    await write_audit(
        db, ctx, f"question.bulk_{body.action}", meta, "question", None,
        details={"done": done, "skipped": len(selected) - done, "notes": body.notes.strip(), "ids": [str(q.id) for q in eligible[:200]]},
    )
    await db.commit()
    return {"done": done, "skipped": len(selected) - done}
