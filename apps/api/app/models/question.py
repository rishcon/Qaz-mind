import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, SmallInteger, String, Text, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base

# 'school' and 'school_archived' belong to a school's own bank: they are never published to everyone.
QUESTION_STATUSES = ("draft", "in_review", "approved", "published", "archived", "school", "school_archived")
QUESTION_DIFFICULTIES = ("easy", "medium", "hard")


class Question(Base):
    """A question of the bank. Only a published question may be used by practice or exams.

    Lifecycle: draft -> in_review -> approved -> published -> archived; a reviewer may return a question
    from review to draft with notes. Nobody approves or publishes a question they wrote.
    """

    __tablename__ = "questions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'in_review', 'approved', 'published', 'archived', 'school', 'school_archived')",
            name="status_valid",
        ),
        CheckConstraint(
            "(organization_id IS NULL AND author_staff_id IS NOT NULL AND status IN ('draft', 'in_review', 'approved', 'published', 'archived')) "
            "OR (organization_id IS NOT NULL AND author_user_id IS NOT NULL AND status IN ('school', 'school_archived'))",
            name="owner_valid",
        ),
        CheckConstraint("difficulty IN ('easy', 'medium', 'hard')", name="difficulty_valid"),
        CheckConstraint("type IN ('single_choice')", name="type_valid"),
        CheckConstraint("points BETWEEN 1 AND 5", name="points_range"),
        CheckConstraint("jsonb_typeof(options) = 'array' AND jsonb_array_length(options) >= 2", name="options_valid"),
        Index("ix_questions_subject_status", "subject_id", "status"),
        Index("ix_questions_org", "organization_id", "subject_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    subject_id: Mapped[str] = mapped_column(String(32), ForeignKey("subjects.id"))
    topic_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("curriculum_topics.id"), nullable=True)
    type: Mapped[str] = mapped_column(String(24), default="single_choice")
    difficulty: Mapped[str] = mapped_column(String(8))
    points: Mapped[int] = mapped_column(SmallInteger, default=1)
    text_ru: Mapped[str] = mapped_column(Text)
    text_kz: Mapped[str] = mapped_column(Text, default="")
    # [{"label": "A", "text_ru": "...", "text_kz": "..."}, ...]
    options: Mapped[list] = mapped_column(JSONB)
    correct_label: Mapped[str] = mapped_column(String(2))
    explanation_ru: Mapped[str] = mapped_column(Text, default="")
    explanation_kz: Mapped[str] = mapped_column(Text, default="")
    source_reference: Mapped[str] = mapped_column(String(300), default="")
    external_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="draft")
    review_notes: Mapped[str] = mapped_column(Text, default="")
    # A platform question has a staff author; a school's own question has an organization and a user author.
    author_staff_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("staff_members.id"), nullable=True)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("organizations.id"), nullable=True)
    author_user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id"), nullable=True)
    reviewer_staff_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("staff_members.id"), nullable=True)
    version: Mapped[int] = mapped_column(SmallInteger, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
