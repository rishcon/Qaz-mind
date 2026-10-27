"""Platform staff: accounts, roles, sessions, invitations and the audit log.

Staff accounts are separate from student accounts. They are created only by invitation from an owner
(or, for the very first owner, by a server command), sign in with a password and a TOTP code, and every
administrative action is written to the audit log.
"""

import uuid
from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Uuid,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.time import utcnow
from app.db.base import Base

STAFF_ROLES = (
    "OWNER",
    "PLATFORM_ADMIN",
    "CONTENT_MANAGER",
    "CONTENT_REVIEWER",
    "SUPPORT_AGENT",
    "FINANCE_MANAGER",
    "ANALYST",
)
STAFF_STATUSES = ("invited", "active", "disabled")


class StaffMember(Base):
    __tablename__ = "staff_members"
    __table_args__ = (
        CheckConstraint("email = lower(email)", name="email_normalized"),
        CheckConstraint("status IN ('invited', 'active', 'disabled')", name="status_valid"),
        CheckConstraint("failed_login_count >= 0", name="failed_login_count_non_negative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(254), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    # Empty until the invitation is accepted and the person sets a password.
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="invited")
    # TOTP secret (base32). Kept while enrolment is pending; totp_enabled turns on after the first valid code.
    totp_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    totp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    # Last accepted TOTP time step: the same code cannot be used twice.
    totp_last_step: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    failed_login_count: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("staff_members.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_sign_in_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class StaffRole(Base):
    __tablename__ = "staff_roles"
    __table_args__ = (
        CheckConstraint(
            "role IN ('OWNER', 'PLATFORM_ADMIN', 'CONTENT_MANAGER', 'CONTENT_REVIEWER', "
            "'SUPPORT_AGENT', 'FINANCE_MANAGER', 'ANALYST')",
            name="role_valid",
        ),
    )

    staff_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("staff_members.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[str] = mapped_column(String(32), primary_key=True)
    granted_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("staff_members.id"), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class StaffSession(Base):
    """Staff session. The cookie carries a random token; only its hash is stored."""

    __tablename__ = "staff_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("staff_members.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    # Null until the second factor is confirmed. Only an MFA-confirmed session may call admin endpoints.
    mfa_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class StaffInvitation(Base):
    __tablename__ = "staff_invitations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    staff_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("staff_members.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True)
    invited_by: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("staff_members.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditEvent(Base):
    """Append-only record of an administrative action. No endpoint updates or deletes these rows."""

    __tablename__ = "audit_events"
    __table_args__ = (Index("ix_audit_events_created_at", "created_at"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    actor_staff_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("staff_members.id"), nullable=True)
    # Kept as text too, so the record stays readable even if the account is renamed.
    actor_email: Mapped[str | None] = mapped_column(String(254), nullable=True)
    actor_roles: Mapped[list] = mapped_column(JSONB, default=list)
    action: Mapped[str] = mapped_column(String(64), index=True)
    target_type: Mapped[str | None] = mapped_column(String(32), nullable=True)
    target_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    result: Mapped[str] = mapped_column(String(16), default="success")
    details: Mapped[dict] = mapped_column(JSONB, default=dict)
    request_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
