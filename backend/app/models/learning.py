import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, SmallInteger, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base

PROGRESS_STATES = ("not_started", "in_progress", "completed")


class LessonProgress(Base):
    """A student's progress through one lesson. Completion is stored once and never reverted."""

    __tablename__ = "lesson_progress"
    __table_args__ = (
        CheckConstraint("state IN ('not_started', 'in_progress', 'completed')", name="state_valid"),
        CheckConstraint("last_step >= 0", name="last_step_non_negative"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    lesson_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("lessons.id", ondelete="CASCADE"), primary_key=True)
    # The published version the student was reading; kept so a later text change does not rewrite history.
    version_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("lesson_versions.id"))
    state: Mapped[str] = mapped_column(String(16), default="in_progress")
    last_step: Mapped[int] = mapped_column(SmallInteger, default=0)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
