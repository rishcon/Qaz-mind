"""Curriculum in QazMind Admin: subjects, topics, lessons and their versions.

A lesson version goes draft -> in_review -> approved -> published -> archived (app/content/service.py).
The author of a version is the staff member who created it; that person cannot approve or publish it.
"""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select

from app.admin.service import StaffContext, write_audit
from app.api.deps import get_db
from app.api.v1.admin.deps import MetaDep, StaffDep, require
from app.content.schemas import SLUG_RE, StepIn
from app.content.service import ContentError, apply_transition
from app.core.errors import AppError
from app.core.time import utcnow
from app.models import CurriculumTopic, Lesson, LessonProgress, LessonVersion, Question, Subject

router = APIRouter(tags=["admin-content"])

# Which permission each workflow action needs.
ACTION_PERMISSION = {
    "submit": "content.edit",
    "return": "content.review",
    "approve": "content.review",
    "publish": "content.publish",
    "archive": "content.publish",
}


@router.get("/subjects")
async def list_subjects(ctx: StaffDep, db=Depends(get_db)) -> dict:
    subjects = (await db.execute(select(Subject).order_by(Subject.code))).scalars().all()
    topics = dict(
        (await db.execute(select(CurriculumTopic.subject_id, func.count()).group_by(CurriculumTopic.subject_id))).all()
    )
    lessons = dict(
        (
            await db.execute(
                select(CurriculumTopic.subject_id, func.count(Lesson.id))
                .join(Lesson, Lesson.topic_id == CurriculumTopic.id)
                .group_by(CurriculumTopic.subject_id)
            )
        ).all()
    )
    published = dict(
        (
            await db.execute(
                select(CurriculumTopic.subject_id, func.count(func.distinct(Lesson.id)))
                .join(Lesson, Lesson.topic_id == CurriculumTopic.id)
                .join(LessonVersion, LessonVersion.lesson_id == Lesson.id)
                .where(LessonVersion.status == "published")
                .group_by(CurriculumTopic.subject_id)
            )
        ).all()
    )
    questions = dict((await db.execute(select(Question.subject_id, func.count()).where(Question.organization_id.is_(None)).group_by(Question.subject_id))).all())
    return {
        "items": [
            {
                "id": s.id,
                "code": s.code,
                "title_ru": s.title_ru,
                "title_kz": s.title_kz,
                "category": s.category,
                "active": s.active,
                "topics": topics.get(s.id, 0),
                "lessons": lessons.get(s.id, 0),
                "lessons_published": published.get(s.id, 0),
                "questions": questions.get(s.id, 0),
            }
            for s in subjects
        ]
    }


@router.get("/topics")
async def list_topics(ctx: StaffDep, subject_id: str | None = None, db=Depends(get_db)) -> dict:
    query = select(CurriculumTopic).order_by(CurriculumTopic.subject_id, CurriculumTopic.position)
    if subject_id:
        query = query.where(CurriculumTopic.subject_id == subject_id)
    topics = (await db.execute(query)).scalars().all()
    counts = dict((await db.execute(select(Lesson.topic_id, func.count()).group_by(Lesson.topic_id))).all())
    return {
        "items": [
            {
                "id": str(t.id),
                "subject_id": t.subject_id,
                "slug": t.slug,
                "position": t.position,
                "title_ru": t.title_ru,
                "title_kz": t.title_kz,
                "lessons": counts.get(t.id, 0),
            }
            for t in topics
        ]
    }


class TopicIn(BaseModel):
    subject_id: str = Field(min_length=3, max_length=32)
    slug: str = Field(pattern=SLUG_RE, min_length=3, max_length=80)
    title_ru: str = Field(min_length=1, max_length=200)
    title_kz: str = Field(min_length=1, max_length=200)


@router.post("/topics", status_code=201)
async def create_topic(
    body: TopicIn,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("content.create"))],
    db=Depends(get_db),
) -> dict:
    subject = await db.get(Subject, body.subject_id)
    if subject is None:
        raise AppError(404, "SUBJECT_NOT_FOUND", "Предмет не найден")
    exists = (
        await db.execute(
            select(CurriculumTopic).where(CurriculumTopic.subject_id == subject.id, CurriculumTopic.slug == body.slug)
        )
    ).scalar_one_or_none()
    if exists is not None:
        raise AppError(409, "TOPIC_EXISTS", "Тема с таким кодом уже есть в этом предмете")
    position = (
        await db.execute(
            select(func.coalesce(func.max(CurriculumTopic.position), 0)).where(CurriculumTopic.subject_id == subject.id)
        )
    ).scalar_one() + 1
    topic = CurriculumTopic(
        subject_id=subject.id, slug=body.slug, position=position,
        title_ru=body.title_ru.strip(), title_kz=body.title_kz.strip(),
    )
    db.add(topic)
    await db.flush()
    await write_audit(db, ctx, "topic.created", meta, "topic", str(topic.id),
                      details={"subject": subject.id, "slug": body.slug})
    await db.commit()
    return {"id": str(topic.id)}


def _version_out(v: LessonVersion) -> dict:
    return {
        "id": str(v.id),
        "version": v.version,
        "status": v.status,
        "title_ru": v.title_ru,
        "title_kz": v.title_kz,
        "estimated_minutes": v.estimated_minutes,
        "source_reference": v.source_reference,
        "steps": v.steps,
        "author": v.author,
        "reviewer": v.reviewer,
        "created_at": v.created_at,
        "published_at": v.published_at,
    }


@router.get("/lessons")
async def list_lessons(
    ctx: StaffDep,
    db=Depends(get_db),
    subject_id: str | None = None,
    status: str | None = None,
    search: str = "",
) -> dict:
    latest = (
        select(LessonVersion.lesson_id, func.max(LessonVersion.version).label("version"))
        .group_by(LessonVersion.lesson_id)
        .subquery()
    )
    query = (
        select(Lesson, LessonVersion, CurriculumTopic)
        .join(latest, latest.c.lesson_id == Lesson.id)
        .join(LessonVersion, (LessonVersion.lesson_id == Lesson.id) & (LessonVersion.version == latest.c.version))
        .join(CurriculumTopic, CurriculumTopic.id == Lesson.topic_id)
        .order_by(CurriculumTopic.subject_id, CurriculumTopic.position, Lesson.position)
    )
    if subject_id:
        query = query.where(CurriculumTopic.subject_id == subject_id)
    if status:
        query = query.where(LessonVersion.status == status)
    if search.strip():
        query = query.where(func.lower(LessonVersion.title_ru).like(f"%{search.strip().lower()}%"))
    rows = (await db.execute(query)).all()
    published_ids = set(
        (await db.execute(select(LessonVersion.lesson_id).where(LessonVersion.status == "published"))).scalars().all()
    )
    completed = dict(
        (
            await db.execute(
                select(LessonProgress.lesson_id, func.count())
                .where(LessonProgress.state == "completed")
                .group_by(LessonProgress.lesson_id)
            )
        ).all()
    )
    return {
        "items": [
            {
                "slug": lesson.slug,
                "subject_id": topic.subject_id,
                "topic_id": str(topic.id),
                "topic_title": topic.title_ru,
                "position": lesson.position,
                "has_published": lesson.id in published_ids,
                "completed_by": completed.get(lesson.id, 0),
                "latest": _version_out(version),
            }
            for lesson, version, topic in rows
        ]
    }


async def _lesson(db, slug: str) -> Lesson:
    lesson = (await db.execute(select(Lesson).where(Lesson.slug == slug))).scalar_one_or_none()
    if lesson is None:
        raise AppError(404, "LESSON_NOT_FOUND", "Урок не найден")
    return lesson


@router.get("/lessons/{slug}")
async def get_lesson(slug: str, ctx: StaffDep, db=Depends(get_db)) -> dict:
    lesson = await _lesson(db, slug)
    topic = await db.get(CurriculumTopic, lesson.topic_id)
    versions = (
        await db.execute(
            select(LessonVersion).where(LessonVersion.lesson_id == lesson.id).order_by(LessonVersion.version.desc())
        )
    ).scalars().all()
    return {
        "slug": lesson.slug,
        "subject_id": topic.subject_id,
        "topic_id": str(topic.id),
        "topic_title": topic.title_ru,
        "versions": [_version_out(v) for v in versions],
    }


class LessonBody(BaseModel):
    title_ru: str = Field(min_length=1, max_length=200)
    title_kz: str = Field(min_length=1, max_length=200)
    estimated_minutes: int = Field(ge=1, le=180)
    source_reference: str = Field(min_length=3, max_length=300)
    steps: list[StepIn] = Field(min_length=1, max_length=40)


class LessonCreate(LessonBody):
    topic_id: uuid.UUID
    slug: str = Field(pattern=SLUG_RE, min_length=3, max_length=120)


def _new_version(lesson: Lesson, number: int, body: LessonBody, ctx: StaffContext) -> LessonVersion:
    return LessonVersion(
        lesson_id=lesson.id,
        version=number,
        status="draft",
        title_ru=body.title_ru.strip(),
        title_kz=body.title_kz.strip(),
        estimated_minutes=body.estimated_minutes,
        source_reference=body.source_reference.strip(),
        steps=[s.model_dump() for s in body.steps],
        author=ctx.staff.email,
        created_at=utcnow(),
    )


@router.post("/lessons", status_code=201)
async def create_lesson(
    body: LessonCreate,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("content.create"))],
    db=Depends(get_db),
) -> dict:
    topic = await db.get(CurriculumTopic, body.topic_id)
    if topic is None:
        raise AppError(404, "TOPIC_NOT_FOUND", "Тема не найдена")
    if (await db.execute(select(Lesson).where(Lesson.slug == body.slug))).scalar_one_or_none() is not None:
        raise AppError(409, "LESSON_EXISTS", "Урок с таким кодом уже есть")
    position = (
        await db.execute(select(func.coalesce(func.max(Lesson.position), 0)).where(Lesson.topic_id == topic.id))
    ).scalar_one() + 1
    lesson = Lesson(topic_id=topic.id, slug=body.slug, position=position, created_at=utcnow())
    db.add(lesson)
    await db.flush()
    db.add(_new_version(lesson, 1, body, ctx))
    await write_audit(db, ctx, "lesson.created", meta, "lesson", lesson.slug)
    await db.commit()
    return {"slug": lesson.slug, "version": 1}


@router.post("/lessons/{slug}/versions", status_code=201)
async def create_version(
    slug: str,
    body: LessonBody,
    meta: MetaDep,
    ctx: Annotated[StaffContext, Depends(require("content.edit"))],
    db=Depends(get_db),
) -> dict:
    lesson = await _lesson(db, slug)
    last = (
        await db.execute(select(func.max(LessonVersion.version)).where(LessonVersion.lesson_id == lesson.id))
    ).scalar_one() or 0
    db.add(_new_version(lesson, last + 1, body, ctx))
    await write_audit(db, ctx, "lesson.version_created", meta, "lesson", slug, details={"version": last + 1})
    await db.commit()
    return {"slug": slug, "version": last + 1}


class TransitionIn(BaseModel):
    action: Literal["submit", "return", "approve", "publish", "archive"]


@router.post("/lessons/{slug}/versions/{version}/transition")
async def transition_lesson(
    slug: str,
    version: int,
    body: TransitionIn,
    meta: MetaDep,
    ctx: StaffDep,
    db=Depends(get_db),
) -> dict:
    ctx.require(ACTION_PERMISSION[body.action])
    try:
        updated = await apply_transition(db, slug, version, body.action, ctx.staff.email)
    except ContentError as error:
        raise AppError(409, "WORKFLOW_RULE", str(error)) from error
    await write_audit(db, ctx, f"lesson.{body.action}", meta, "lesson", slug,
                      details={"version": version, "status": updated.status})
    await db.commit()
    return {"status": updated.status}
