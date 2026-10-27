import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, SmallInteger, String, Uuid, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base

LESSON_STATUSES = ("draft", "in_review", "approved", "published", "archived")


class Subject(Base):
    """Subject catalog. Seeded by migration; titles come from the official exam structure."""

    __tablename__ = "subjects"
    __table_args__ = (CheckConstraint("category IN ('mandatory', 'profile')", name="category_valid"),)

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    code: Mapped[str] = mapped_column(String(4), unique=True)
    title_ru: Mapped[str] = mapped_column(String(160))
    title_kz: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(16))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class CurriculumTopic(Base):
    __tablename__ = "curriculum_topics"
    __table_args__ = (
        Index("uq_curriculum_topics_subject_slug", "subject_id", "slug", unique=True),
        CheckConstraint("position >= 1", name="position_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    subject_id: Mapped[str] = mapped_column(String(32), ForeignKey("subjects.id"))
    slug: Mapped[str] = mapped_column(String(80))
    position: Mapped[int] = mapped_column(SmallInteger)
    title_ru: Mapped[str] = mapped_column(String(200))
    title_kz: Mapped[str] = mapped_column(String(200))


class Lesson(Base):
    """A lesson keeps its identity; its text lives in LessonVersion rows."""

    __tablename__ = "lessons"
    __table_args__ = (CheckConstraint("position >= 1", name="position_positive"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    topic_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("curriculum_topics.id", ondelete="CASCADE"), index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True)
    position: Mapped[int] = mapped_column(SmallInteger)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class LessonVersion(Base):
    """One text revision of a lesson. Only a version with status 'published' is shown to students."""

    __tablename__ = "lesson_versions"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'in_review', 'approved', 'published', 'archived')", name="status_valid"),
        CheckConstraint("version >= 1", name="version_positive"),
        CheckConstraint("jsonb_typeof(steps) = 'array' AND jsonb_array_length(steps) >= 1", name="steps_nonempty"),
        CheckConstraint("estimated_minutes BETWEEN 1 AND 180", name="estimated_minutes_range"),
        Index("uq_lesson_versions_lesson_version", "lesson_id", "version", unique=True),
        # At most one published version per lesson.
        Index(
            "uq_lesson_versions_one_published",
            "lesson_id",
            unique=True,
            postgresql_where=text("status = 'published'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("lessons.id", ondelete="CASCADE"), index=True)
    version: Mapped[int] = mapped_column(SmallInteger)
    status: Mapped[str] = mapped_column(String(16))
    title_ru: Mapped[str] = mapped_column(String(200))
    title_kz: Mapped[str] = mapped_column(String(200))
    estimated_minutes: Mapped[int] = mapped_column(SmallInteger)
    source_reference: Mapped[str] = mapped_column(String(300))
    steps: Mapped[list] = mapped_column(JSONB)
    author: Mapped[str] = mapped_column(String(120))
    reviewer: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
