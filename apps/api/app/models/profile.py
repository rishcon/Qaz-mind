import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, SmallInteger, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base

EXAM_PERIODS = ("june_main", "march_paid", "ent_2027")


class ProfilePair(Base):
    """Official profile subject pairs (reference data, seeded by migration)."""

    __tablename__ = "profile_pairs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    code: Mapped[str] = mapped_column(String(4), unique=True)
    title_ru: Mapped[str] = mapped_column(String(160))
    title_kz: Mapped[str] = mapped_column(String(160))
    cluster_ru: Mapped[str] = mapped_column(String(255))
    cluster_kz: Mapped[str] = mapped_column(String(255))
    subject_1_code: Mapped[str] = mapped_column(String(32))
    subject_2_code: Mapped[str] = mapped_column(String(32))
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class StudentProfile(Base):
    """Personal study settings. One row per user, created by onboarding."""

    __tablename__ = "student_profiles"
    __table_args__ = (
        CheckConstraint("interface_lang IN ('ru', 'kz')", name="interface_lang_valid"),
        CheckConstraint("exam_lang IN ('ru', 'kz')", name="exam_lang_valid"),
        CheckConstraint("target_score BETWEEN 60 AND 140", name="target_score_range"),
        CheckConstraint("exam_year BETWEEN 2026 AND 2030", name="exam_year_range"),
        CheckConstraint("exam_period IN ('june_main', 'march_paid', 'ent_2027')", name="exam_period_valid"),
        CheckConstraint("daily_goal_minutes BETWEEN 10 AND 240", name="daily_goal_range"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    interface_lang: Mapped[str] = mapped_column(String(2))
    exam_lang: Mapped[str] = mapped_column(String(2))
    profile_pair_id: Mapped[str] = mapped_column(String(32), ForeignKey("profile_pairs.id"))
    target_score: Mapped[int] = mapped_column(SmallInteger)
    exam_year: Mapped[int] = mapped_column(SmallInteger)
    exam_period: Mapped[str] = mapped_column(String(16))
    daily_goal_minutes: Mapped[int] = mapped_column(SmallInteger)
    onboarding_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
