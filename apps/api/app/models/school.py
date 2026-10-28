"""Schools: applications, organizations, memberships and classes.

An application is reviewed by platform staff. Approving it creates the organization and makes the applicant its
school administrator; nothing on the client side can activate a school.
"""

import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, SmallInteger, String, Text, UniqueConstraint, Uuid, text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base

ORGANIZATION_TYPES = ("school", "lyceum", "gymnasium", "college", "tutoring_center", "other")
ORGANIZATION_ROLES = ("SCHOOL_ADMIN", "TEACHER")


class OrganizationApplication(Base):
    __tablename__ = "organization_applications"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name="status_valid"),
        CheckConstraint("approx_students >= 1", name="approx_students_positive"),
        # One open application per person: a second one would only be a duplicate in the moderation queue.
        Index(
            "uq_organization_applications_one_pending",
            "applicant_user_id",
            unique=True,
            postgresql_where=text("status = 'pending'"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    applicant_user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    school_name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(24))
    city: Mapped[str] = mapped_column(String(120))
    contact_name: Mapped[str] = mapped_column(String(120))
    contact_phone: Mapped[str] = mapped_column(String(40))
    contact_position: Mapped[str] = mapped_column(String(120), default="")
    approx_students: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(12), default="pending")
    rejection_reason: Mapped[str] = mapped_column(Text, default="")
    reviewed_by_staff_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("staff_members.id"), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    organization_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("organizations.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Organization(Base):
    __tablename__ = "organizations"
    __table_args__ = (CheckConstraint("status IN ('active', 'suspended', 'archived')", name="status_valid"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200))
    type: Mapped[str] = mapped_column(String(24))
    city: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(12), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)


class OrganizationMember(Base):
    """A person's role inside one organization. One row per person and organization."""

    __tablename__ = "organization_members"
    __table_args__ = (
        UniqueConstraint("organization_id", "user_id", name="uq_organization_members_org_user"),
        CheckConstraint("role IN ('SCHOOL_ADMIN', 'TEACHER')", name="role_valid"),
        CheckConstraint("status IN ('active', 'revoked')", name="status_valid"),
        Index("ix_organization_members_user", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(10), default="active")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SchoolClass(Base):
    __tablename__ = "school_classes"
    __table_args__ = (
        UniqueConstraint("organization_id", "academic_year", "name_key", name="uq_school_classes_org_year_name"),
        CheckConstraint("status IN ('active', 'archived')", name="status_valid"),
        CheckConstraint("grade IS NULL OR grade BETWEEN 1 AND 12", name="grade_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("organizations.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(80))
    # Lower-cased name without extra spaces: "11 А" and "11  а" are the same class in one year.
    name_key: Mapped[str] = mapped_column(String(80))
    academic_year: Mapped[str] = mapped_column(String(9))
    grade: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(10), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class ClassMember(Base):
    __tablename__ = "class_members"
    __table_args__ = (
        UniqueConstraint("class_id", "user_id", name="uq_class_members_class_user"),
        CheckConstraint("role IN ('student', 'teacher')", name="role_valid"),
        CheckConstraint("status IN ('active', 'removed')", name="status_valid"),
        Index("ix_class_members_user", "user_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    class_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("school_classes.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(8))
    status: Mapped[str] = mapped_column(String(8), default="active")
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
