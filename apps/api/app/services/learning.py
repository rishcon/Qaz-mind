import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.time import utcnow
from app.models import CurriculumTopic, Lesson, LessonProgress, LessonVersion, Subject
from app.schemas.learning import (
    CurriculumOut,
    LessonOut,
    LessonProgressOut,
    LessonStepOut,
    LessonSummaryOut,
    ProgressOut,
    SubjectOut,
    TopicOut,
)

NOT_STARTED = LessonProgressOut(state="not_started", last_step=0, completed_at=None)


def _progress_out(row: LessonProgress | None) -> LessonProgressOut:
    if row is None:
        return NOT_STARTED
    return LessonProgressOut(state=row.state, last_step=row.last_step, completed_at=row.completed_at)


class LearningService:
    """Reads only published content. Drafts and archived versions are never returned to students."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_subjects(self) -> list[SubjectOut]:
        counts = dict(
            (
                await self.db.execute(
                    select(CurriculumTopic.subject_id, func.count(Lesson.id))
                    .join(Lesson, Lesson.topic_id == CurriculumTopic.id)
                    .join(LessonVersion, (LessonVersion.lesson_id == Lesson.id) & (LessonVersion.status == "published"))
                    .group_by(CurriculumTopic.subject_id)
                )
            ).all()
        )
        subjects = (await self.db.execute(select(Subject).where(Subject.active.is_(True)).order_by(Subject.code))).scalars()
        return [
            SubjectOut(
                id=subject.id,
                code=subject.code,
                title_ru=subject.title_ru,
                title_kz=subject.title_kz,
                category=subject.category,
                published_lessons=counts.get(subject.id, 0),
            )
            for subject in subjects
        ]

    async def curriculum(self, subject_id: str, user_id: uuid.UUID) -> CurriculumOut:
        subject = await self.db.get(Subject, subject_id)
        if subject is None or not subject.active:
            raise AppError(404, "SUBJECT_NOT_FOUND", "Предмет не найден")

        rows = (
            await self.db.execute(
                select(CurriculumTopic, Lesson, LessonVersion, LessonProgress)
                .join(Lesson, Lesson.topic_id == CurriculumTopic.id)
                .join(LessonVersion, (LessonVersion.lesson_id == Lesson.id) & (LessonVersion.status == "published"))
                .outerjoin(LessonProgress, (LessonProgress.lesson_id == Lesson.id) & (LessonProgress.user_id == user_id))
                .where(CurriculumTopic.subject_id == subject_id)
                .order_by(CurriculumTopic.position, Lesson.position)
            )
        ).all()

        topics: dict[str, TopicOut] = {}
        for topic, lesson, version, progress in rows:
            if topic.slug not in topics:
                topics[topic.slug] = TopicOut(slug=topic.slug, title_ru=topic.title_ru, title_kz=topic.title_kz, lessons=[])
            topics[topic.slug].lessons.append(
                LessonSummaryOut(
                    slug=lesson.slug,
                    title_ru=version.title_ru,
                    title_kz=version.title_kz,
                    estimated_minutes=version.estimated_minutes,
                    progress=_progress_out(progress),
                )
            )

        subject_out = SubjectOut(
            id=subject.id,
            code=subject.code,
            title_ru=subject.title_ru,
            title_kz=subject.title_kz,
            category=subject.category,
            published_lessons=len(rows),
        )
        return CurriculumOut(subject=subject_out, topics=list(topics.values()))

    async def get_lesson(self, slug: str, user_id: uuid.UUID) -> LessonOut:
        lesson, version, topic = await self._published(slug)
        progress = await self.db.get(LessonProgress, (user_id, lesson.id))
        return LessonOut(
            slug=lesson.slug,
            subject_id=topic.subject_id,
            topic_slug=topic.slug,
            title_ru=version.title_ru,
            title_kz=version.title_kz,
            estimated_minutes=version.estimated_minutes,
            source_reference=version.source_reference,
            version=version.version,
            steps=[
                LessonStepOut(index=index, **step)
                for index, step in enumerate(version.steps)
            ],
            progress=_progress_out(progress),
        )

    async def save_progress(self, user_id: uuid.UUID, slug: str, last_step: int, completed: bool) -> ProgressOut:
        lesson, version, _ = await self._published(slug)
        total = len(version.steps)
        if last_step >= total:
            raise AppError(422, "VALIDATION_ERROR", f"В уроке {total} шагов: номер шага должен быть от 0 до {total - 1}")
        if completed and last_step != total - 1:
            raise AppError(422, "VALIDATION_ERROR", "Урок считается пройденным только на последнем шаге")

        now = utcnow()
        row = await self.db.get(LessonProgress, (user_id, lesson.id))
        if row is None:
            row = LessonProgress(user_id=user_id, lesson_id=lesson.id, version_id=version.id, state="in_progress", last_step=0)
            self.db.add(row)
        if row.state != "completed":
            row.version_id = version.id
            row.last_step = last_step
            row.state = "completed" if completed else "in_progress"
            if completed:
                row.completed_at = now
        # A completed lesson stays completed: repeating the request or reading it again changes nothing.
        await self.db.commit()
        await self.db.refresh(row)
        return ProgressOut(
            lesson_slug=lesson.slug,
            state=row.state,
            last_step=row.last_step,
            completed_at=row.completed_at,
        )

    async def my_progress(self, user_id: uuid.UUID) -> list[ProgressOut]:
        rows = (
            await self.db.execute(
                select(LessonProgress, Lesson.slug)
                .join(Lesson, Lesson.id == LessonProgress.lesson_id)
                .where(LessonProgress.user_id == user_id)
                .order_by(Lesson.slug)
            )
        ).all()
        return [
            ProgressOut(lesson_slug=slug, state=row.state, last_step=row.last_step, completed_at=row.completed_at)
            for row, slug in rows
        ]

    async def _published(self, slug: str) -> tuple[Lesson, LessonVersion, CurriculumTopic]:
        row = (
            await self.db.execute(
                select(Lesson, LessonVersion, CurriculumTopic)
                .join(LessonVersion, (LessonVersion.lesson_id == Lesson.id) & (LessonVersion.status == "published"))
                .join(CurriculumTopic, CurriculumTopic.id == Lesson.topic_id)
                .where(Lesson.slug == slug)
            )
        ).first()
        if row is None:
            # A missing lesson and an unpublished one look the same from outside.
            raise AppError(404, "LESSON_NOT_FOUND", "Урок не найден")
        return row[0], row[1], row[2]
