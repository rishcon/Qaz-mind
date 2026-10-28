import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Index, String, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base


class PracticeSession(Base):
    """One practice run: the questions picked for a student, in the order they are shown.

    The question list is fixed when the session is created, so a reload shows the same questions and a later
    change to the bank does not rewrite a run that already happened.
    """

    __tablename__ = "practice_sessions"
    __table_args__ = (Index("ix_practice_sessions_user", "user_id", "created_at"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    subject_id: Mapped[str] = mapped_column(String(32), ForeignKey("subjects.id"))
    question_ids: Mapped[list] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PracticeAnswer(Base):
    """A student's answer, checked by the server. Stored once per question and session, never changed."""

    __tablename__ = "practice_answers"
    __table_args__ = (
        CheckConstraint("selected_label IN ('A', 'B', 'C', 'D', 'E')", name="label_valid"),
        Index("ix_practice_answers_question", "question_id"),
    )

    session_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("practice_sessions.id", ondelete="CASCADE"), primary_key=True
    )
    question_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("questions.id"), primary_key=True)
    selected_label: Mapped[str] = mapped_column(String(2))
    is_correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
