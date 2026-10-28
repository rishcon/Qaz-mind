"""School assignments and the attempts of students.

Attempts live in their own tables, so a school result never mixes with the student's personal practice progress
and neither is changed when the student joins or leaves a school. The answers are checked against the same
question bank and key as practice.
"""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, SmallInteger, String, UniqueConstraint, Uuid
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base


class Assignment(Base):
    __tablename__ = "assignments"
    __table_args__ = (
        CheckConstraint("status IN ('draft', 'published', 'closed', 'archived')", name="status_valid"),
        CheckConstraint("score_policy IN ('best', 'last')", name="score_policy_valid"),
        CheckConstraint("reveal IN ('after_submit', 'after_close')", name="reveal_valid"),
        CheckConstraint("question_count BETWEEN 1 AND 40", name="question_count_range"),
        CheckConstraint("max_attempts BETWEEN 1 AND 10", name="max_attempts_range"),
        Index("ix_assignments_org_status", "organization_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.id", ondelete="CASCADE"))
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(160))
    subject_id: Mapped[str] = mapped_column(String(32), ForeignKey("subjects.id"))
    question_count: Mapped[int] = mapped_column(SmallInteger)
    # Questions from the school's own bank chosen by the teacher; the rest of `question_count` comes from the platform.
    school_question_ids: Mapped[list] = mapped_column(JSONB, default=list, server_default="[]")
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_attempts: Mapped[int] = mapped_column(SmallInteger, default=1)
    # Which attempt counts as the result: the best one or the last one. Shown to the teacher explicitly.
    score_policy: Mapped[str] = mapped_column(String(8), default="best")
    # When a student may see the score and the key: right after submitting or once the teacher closes the assignment.
    reveal: Mapped[str] = mapped_column(String(12), default="after_close")
    status: Mapped[str] = mapped_column(String(10), default="draft")
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AssignmentClass(Base):
    __tablename__ = "assignment_classes"

    assignment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("assignments.id", ondelete="CASCADE"), primary_key=True)
    class_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("school_classes.id", ondelete="CASCADE"), primary_key=True)


class AssignmentQuestion(Base):
    """The fixed composition of a published assignment: chosen once at publication, never re-drawn."""

    __tablename__ = "assignment_questions"

    assignment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("assignments.id", ondelete="CASCADE"), primary_key=True)
    question_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("questions.id"), primary_key=True)
    position: Mapped[int] = mapped_column(SmallInteger)


class AssignmentAttempt(Base):
    __tablename__ = "assignment_attempts"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", "number", name="uq_assignment_attempts_number"),
        CheckConstraint("number >= 1", name="number_positive"),
        Index("ix_assignment_attempts_student", "student_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    assignment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("assignments.id", ondelete="CASCADE"))
    student_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    number: Mapped[int] = mapped_column(SmallInteger)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_score: Mapped[int | None] = mapped_column(Integer, nullable=True)


class AssignmentAnswer(Base):
    __tablename__ = "assignment_answers"
    __table_args__ = (CheckConstraint("selected_label IN ('A', 'B', 'C', 'D', 'E')", name="label_valid"),)

    attempt_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("assignment_attempts.id", ondelete="CASCADE"), primary_key=True)
    question_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("questions.id"), primary_key=True)
    selected_label: Mapped[str] = mapped_column(String(2))
    is_correct: Mapped[bool] = mapped_column()
    answered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
