"""Curriculum content workflow: import as drafts, then review, approval and publication.

Lifecycle of a lesson version: draft -> in_review -> approved -> published -> archived.
Students see only the published version. Nobody approves or publishes their own material.
"""

from dataclasses import dataclass

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.content.schemas import ContentFile
from app.core.time import utcnow
from app.models import CurriculumTopic, Lesson, LessonVersion, Subject

# action -> (required current status, next status)
TRANSITIONS: dict[str, tuple[str, str]] = {
    "submit": ("draft", "in_review"),
    "return": ("in_review", "draft"),
    "approve": ("in_review", "approved"),
    "publish": ("approved", "published"),
    "archive": ("published", "archived"),
}
# Actions that put a second person's name on the text, so the author may not perform them.
REVIEW_ACTIONS = frozenset({"approve", "publish"})


class ContentError(Exception):
    """A rule of the content workflow was violated. The message is shown to the operator."""


@dataclass(frozen=True)
class ImportResult:
    created: list[tuple[str, int]]


async def import_content(db: AsyncSession, content: ContentFile) -> ImportResult:
    subject = await db.get(Subject, content.subject)
    if subject is None or not subject.active:
        raise ContentError(f"Предмет «{content.subject}» не найден или отключён")

    created: list[tuple[str, int]] = []
    for topic_in in content.topics:
        topic = (
            await db.execute(
                select(CurriculumTopic).where(
                    CurriculumTopic.subject_id == subject.id,
                    CurriculumTopic.slug == topic_in.slug,
                )
            )
        ).scalar_one_or_none()
        if topic is None:
            topic = CurriculumTopic(subject_id=subject.id, slug=topic_in.slug)
            db.add(topic)
        topic.position = topic_in.position
        topic.title_ru = topic_in.title_ru
        topic.title_kz = topic_in.title_kz
        await db.flush()

        for lesson_in in topic_in.lessons:
            lesson = (await db.execute(select(Lesson).where(Lesson.slug == lesson_in.slug))).scalar_one_or_none()
            if lesson is None:
                lesson = Lesson(topic_id=topic.id, slug=lesson_in.slug, position=lesson_in.position)
                db.add(lesson)
                await db.flush()
            elif lesson.topic_id != topic.id:
                raise ContentError(f"Урок «{lesson_in.slug}» уже принадлежит другой теме")
            else:
                lesson.position = lesson_in.position

            last_version = (
                await db.execute(select(func.max(LessonVersion.version)).where(LessonVersion.lesson_id == lesson.id))
            ).scalar_one()
            version_no = (last_version or 0) + 1
            db.add(
                LessonVersion(
                    lesson_id=lesson.id,
                    version=version_no,
                    status="draft",
                    title_ru=lesson_in.title_ru,
                    title_kz=lesson_in.title_kz,
                    estimated_minutes=lesson_in.estimated_minutes,
                    source_reference=lesson_in.source_reference,
                    steps=[step.model_dump() for step in lesson_in.steps],
                    author=content.author,
                    created_at=utcnow(),
                )
            )
            created.append((lesson.slug, version_no))

    await db.commit()
    return ImportResult(created=created)


async def apply_transition(db: AsyncSession, lesson_slug: str, version_no: int, action: str, actor: str) -> LessonVersion:
    if action not in TRANSITIONS:
        raise ContentError(f"Неизвестное действие «{action}». Допустимо: {', '.join(TRANSITIONS)}")
    actor = actor.strip()
    if not actor:
        raise ContentError("Укажите, кто выполняет действие (параметр --by)")

    lesson = (await db.execute(select(Lesson).where(Lesson.slug == lesson_slug))).scalar_one_or_none()
    if lesson is None:
        raise ContentError(f"Урок «{lesson_slug}» не найден")
    version = (
        await db.execute(
            select(LessonVersion).where(LessonVersion.lesson_id == lesson.id, LessonVersion.version == version_no)
        )
    ).scalar_one_or_none()
    if version is None:
        raise ContentError(f"Версии {version_no} у урока «{lesson_slug}» нет")

    required, target = TRANSITIONS[action]
    if version.status != required:
        raise ContentError(
            f"Действие «{action}» возможно только из статуса «{required}», сейчас «{version.status}»"
        )
    if action in REVIEW_ACTIONS and actor == version.author:
        raise ContentError("Автор не может утверждать или публиковать свой материал")

    if action == "approve":
        version.reviewer = actor
    if action == "publish":
        previous = (
            await db.execute(
                select(LessonVersion).where(
                    LessonVersion.lesson_id == lesson.id,
                    LessonVersion.status == "published",
                )
            )
        ).scalar_one_or_none()
        if previous is not None:
            previous.status = "archived"
            # Flush the archive first: the database allows only one published version per lesson.
            await db.flush()
        version.published_at = utcnow()
    version.status = target
    await db.commit()
    return version


async def content_status(db: AsyncSession) -> list[dict]:
    rows = (
        await db.execute(
            select(Subject.id, Lesson.slug, LessonVersion.version, LessonVersion.status, LessonVersion.author, LessonVersion.reviewer)
            .select_from(LessonVersion)
            .join(Lesson, Lesson.id == LessonVersion.lesson_id)
            .join(CurriculumTopic, CurriculumTopic.id == Lesson.topic_id)
            .join(Subject, Subject.id == CurriculumTopic.subject_id)
            .order_by(Subject.id, Lesson.slug, LessonVersion.version)
        )
    ).all()
    return [
        {
            "subject": subject_id,
            "lesson": slug,
            "version": version,
            "status": status,
            "author": author,
            "reviewer": reviewer,
        }
        for subject_id, slug, version, status, author, reviewer in rows
    ]
