"""Staff sign-in, sessions, invitations, roles and the audit log.

Sign-in has two steps. The password opens a session that may do nothing but confirm the second factor;
only after a valid TOTP code is the session allowed to call admin endpoints. A person without TOTP
enrols it during that step. Every change made through the admin is written to the audit log.
"""

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin import totp
from app.admin.permissions import permissions_for
from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import (
    burn_password_time,
    generate_token,
    hash_password,
    hash_token,
    normalize_email,
    verify_password,
)
from app.core.time import utcnow
from app.models import AuditEvent, StaffInvitation, StaffMember, StaffRole, StaffSession
from app.models.admin import STAFF_ROLES
from app.services.mail import MailDeliveryError, Mailer, OutgoingEmail

BAD_CREDENTIALS = "Неверный email или пароль"
INVALID_INVITATION = "Ссылка приглашения недействительна или устарела"


@dataclass(frozen=True)
class StaffContext:
    staff: StaffMember
    session: StaffSession
    roles: tuple[str, ...]
    permissions: frozenset[str]

    @property
    def mfa_verified(self) -> bool:
        return self.session.mfa_verified_at is not None

    def require(self, permission: str) -> None:
        if permission not in self.permissions:
            raise AppError(403, "FORBIDDEN", "Недостаточно прав для этого действия")


@dataclass(frozen=True)
class RequestMeta:
    request_id: str | None
    ip: str | None


async def roles_of(db: AsyncSession, staff_id: uuid.UUID) -> tuple[str, ...]:
    rows = (await db.execute(select(StaffRole.role).where(StaffRole.staff_id == staff_id))).scalars().all()
    return tuple(sorted(rows))


async def write_audit(
    db: AsyncSession,
    actor: StaffContext | None,
    action: str,
    meta: RequestMeta | None,
    target_type: str | None = None,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
    result: str = "success",
    actor_email: str | None = None,
) -> None:
    """Adds an audit row to the current transaction. The caller commits together with the change itself."""
    db.add(
        AuditEvent(
            actor_staff_id=actor.staff.id if actor else None,
            actor_email=actor.staff.email if actor else actor_email,
            actor_roles=list(actor.roles) if actor else [],
            action=action,
            target_type=target_type,
            target_id=target_id,
            result=result,
            details=details or {},
            request_id=meta.request_id if meta else None,
            ip=meta.ip if meta else None,
            created_at=utcnow(),
        )
    )


def validate_roles(roles: list[str]) -> list[str]:
    unknown = [r for r in roles if r not in STAFF_ROLES]
    if unknown:
        raise AppError(422, "UNKNOWN_ROLE", f"Неизвестная роль: {', '.join(unknown)}")
    if not roles:
        raise AppError(422, "ROLES_REQUIRED", "Нужна хотя бы одна роль")
    return sorted(set(roles))


class StaffService:
    def __init__(self, db: AsyncSession, settings: Settings, mailer: Mailer) -> None:
        self.db = db
        self.settings = settings
        self.mailer = mailer

    # ----- sign-in -----------------------------------------------------------------------------------------

    async def login(self, email: str, password: str, meta: RequestMeta) -> tuple[StaffMember, str]:
        email = normalize_email(email)
        staff = (await self.db.execute(select(StaffMember).where(StaffMember.email == email))).scalar_one_or_none()
        now = utcnow()
        if staff is None or staff.password_hash is None:
            burn_password_time(password)
            await write_audit(self.db, None, "staff.login", meta, result="failure", actor_email=email,
                              details={"reason": "unknown_account"})
            await self.db.commit()
            raise AppError(401, "INVALID_CREDENTIALS", BAD_CREDENTIALS)
        if staff.locked_until and staff.locked_until > now:
            raise AppError(429, "ACCOUNT_LOCKED", "Слишком много неудачных попыток. Попробуйте позже.")
        if not verify_password(staff.password_hash, password):
            staff.failed_login_count += 1
            if staff.failed_login_count >= self.settings.login_max_failures:
                staff.locked_until = now + timedelta(minutes=self.settings.login_lock_minutes)
                staff.failed_login_count = 0
            await write_audit(self.db, None, "staff.login", meta, "staff", str(staff.id), result="failure",
                              actor_email=email, details={"reason": "bad_password"})
            await self.db.commit()
            raise AppError(401, "INVALID_CREDENTIALS", BAD_CREDENTIALS)
        if staff.status != "active":
            await self.db.commit()
            raise AppError(403, "ACCOUNT_DISABLED", "Учётная запись отключена")
        staff.failed_login_count = 0
        staff.locked_until = None
        raw = generate_token()
        self.db.add(
            StaffSession(
                staff_id=staff.id,
                token_hash=hash_token(raw),
                created_at=now,
                last_seen_at=now,
                expires_at=now + timedelta(hours=self.settings.staff_session_hours),
            )
        )
        await self.db.commit()
        return staff, raw

    async def resolve(self, raw_session: str, require_mfa: bool = True) -> StaffContext:
        now = utcnow()
        row = (
            await self.db.execute(
                select(StaffSession, StaffMember)
                .join(StaffMember, StaffMember.id == StaffSession.staff_id)
                .where(StaffSession.token_hash == hash_token(raw_session))
            )
        ).first()
        if row is None:
            raise AppError(401, "NOT_AUTHENTICATED", "Требуется вход сотрудника")
        session, staff = row
        idle_limit = timedelta(minutes=self.settings.staff_session_idle_minutes)
        if (
            session.revoked_at is not None
            or session.expires_at <= now
            or session.last_seen_at + idle_limit <= now
            or staff.status != "active"
        ):
            raise AppError(401, "NOT_AUTHENTICATED", "Сессия завершена. Войдите снова.")
        if require_mfa and session.mfa_verified_at is None:
            raise AppError(401, "MFA_REQUIRED", "Подтвердите вход кодом из приложения")
        session.last_seen_at = now
        await self.db.commit()
        roles = await roles_of(self.db, staff.id)
        return StaffContext(staff=staff, session=session, roles=roles, permissions=permissions_for(roles))

    async def mfa_setup(self, ctx: StaffContext) -> tuple[str, str]:
        """Returns (secret, otpauth URI) for a person who has not enrolled TOTP yet."""
        staff = ctx.staff
        if staff.totp_enabled:
            raise AppError(409, "MFA_ALREADY_ENABLED", "Двухфакторная аутентификация уже настроена")
        if not staff.totp_secret:
            staff.totp_secret = totp.generate_secret()
            await self.db.commit()
        uri = totp.provisioning_uri(staff.totp_secret, staff.email, self.settings.totp_issuer)
        return staff.totp_secret, uri

    async def mfa_verify(self, ctx: StaffContext, code: str, meta: RequestMeta) -> None:
        staff = ctx.staff
        if not staff.totp_secret:
            raise AppError(409, "MFA_NOT_SET_UP", "Сначала настройте приложение-генератор кодов")
        step = totp.verify(staff.totp_secret, code, staff.totp_last_step)
        if step is None:
            await write_audit(self.db, ctx, "staff.mfa", meta, "staff", str(staff.id), result="failure")
            await self.db.commit()
            raise AppError(400, "INVALID_CODE", "Неверный код. Проверьте время на телефоне и введите новый код.")
        enrolled_now = not staff.totp_enabled
        staff.totp_enabled = True
        staff.totp_last_step = step
        staff.last_sign_in_at = utcnow()
        ctx.session.mfa_verified_at = utcnow()
        await write_audit(self.db, ctx, "staff.mfa_enrolled" if enrolled_now else "staff.login", meta,
                          "staff", str(staff.id))
        await self.db.commit()

    async def logout(self, raw_session: str) -> None:
        await self.db.execute(
            update(StaffSession)
            .where(StaffSession.token_hash == hash_token(raw_session), StaffSession.revoked_at.is_(None))
            .values(revoked_at=utcnow())
        )
        await self.db.commit()

    # ----- invitations -------------------------------------------------------------------------------------

    async def create_invitation(
        self, email: str, name: str, roles: list[str], invited_by: StaffContext | None, meta: RequestMeta | None
    ) -> str:
        email = normalize_email(email)
        roles = validate_roles(roles)
        existing = (await self.db.execute(select(StaffMember).where(StaffMember.email == email))).scalar_one_or_none()
        if existing is not None and existing.status != "invited":
            raise AppError(409, "STAFF_EXISTS", "Сотрудник с таким email уже есть")
        if existing is None:
            existing = StaffMember(
                email=email,
                name=name.strip(),
                status="invited",
                created_by=invited_by.staff.id if invited_by else None,
                created_at=utcnow(),
            )
            self.db.add(existing)
            await self.db.flush()
        else:
            existing.name = name.strip()
            # A repeated invitation replaces the earlier link.
            await self.db.execute(delete(StaffInvitation).where(StaffInvitation.staff_id == existing.id))
            await self.db.execute(delete(StaffRole).where(StaffRole.staff_id == existing.id))
        for role in roles:
            self.db.add(StaffRole(staff_id=existing.id, role=role,
                                  granted_by=invited_by.staff.id if invited_by else None, granted_at=utcnow()))
        raw = generate_token()
        self.db.add(
            StaffInvitation(
                staff_id=existing.id,
                token_hash=hash_token(raw),
                invited_by=invited_by.staff.id if invited_by else None,
                created_at=utcnow(),
                expires_at=utcnow() + timedelta(hours=self.settings.staff_invitation_hours),
            )
        )
        await write_audit(self.db, invited_by, "staff.invite", meta, "staff", str(existing.id),
                          details={"email": email, "roles": roles},
                          actor_email=None if invited_by else "server-command")
        await self.db.commit()
        link = self.invitation_link(raw)
        try:
            await self.mailer.send(
                OutgoingEmail(
                    to=email,
                    subject="QazMind Admin: приглашение",
                    text=(
                        f"Вас пригласили в QazMind Admin (роли: {', '.join(roles)}).\n"
                        f"Откройте ссылку, задайте пароль и настройте приложение-генератор кодов "
                        f"(ссылка действует {self.settings.staff_invitation_hours} ч):\n{link}"
                    ),
                )
            )
        except MailDeliveryError as error:
            raise AppError(503, "MAIL_UNAVAILABLE", "Приглашение создано, но письмо не отправлено. Повторите позже.") from error
        return raw

    def invitation_link(self, raw: str) -> str:
        return f"{self.settings.admin_app_url}/accept-invite?token={raw}"

    async def _invitation(self, raw: str) -> tuple[StaffInvitation, StaffMember]:
        row = (
            await self.db.execute(
                select(StaffInvitation, StaffMember)
                .join(StaffMember, StaffMember.id == StaffInvitation.staff_id)
                .where(StaffInvitation.token_hash == hash_token(raw))
            )
        ).first()
        if row is None:
            raise AppError(400, "INVALID_INVITATION", INVALID_INVITATION)
        invitation, staff = row
        if invitation.accepted_at is not None or invitation.expires_at <= utcnow() or staff.status != "invited":
            raise AppError(400, "INVALID_INVITATION", INVALID_INVITATION)
        return invitation, staff

    async def invitation_info(self, raw: str) -> tuple[StaffMember, tuple[str, ...]]:
        _, staff = await self._invitation(raw)
        return staff, await roles_of(self.db, staff.id)

    async def accept_invitation(self, raw: str, name: str, password: str, meta: RequestMeta) -> None:
        if len(password) < self.settings.staff_password_min_length:
            raise AppError(422, "PASSWORD_TOO_SHORT",
                           f"Пароль сотрудника — не менее {self.settings.staff_password_min_length} символов")
        invitation, staff = await self._invitation(raw)
        result = await self.db.execute(
            update(StaffInvitation)
            .where(StaffInvitation.id == invitation.id, StaffInvitation.accepted_at.is_(None))
            .values(accepted_at=utcnow())
        )
        if result.rowcount != 1:
            await self.db.rollback()
            raise AppError(400, "INVALID_INVITATION", INVALID_INVITATION)
        staff.name = name.strip() or staff.name
        staff.password_hash = hash_password(password)
        staff.status = "active"
        await write_audit(self.db, None, "staff.invite_accepted", meta, "staff", str(staff.id), actor_email=staff.email)
        await self.db.commit()

    # ----- staff management (owner) ------------------------------------------------------------------------

    async def list_staff(self) -> list[tuple[StaffMember, tuple[str, ...]]]:
        members = (await self.db.execute(select(StaffMember).order_by(StaffMember.created_at))).scalars().all()
        return [(m, await roles_of(self.db, m.id)) for m in members]

    async def _get(self, staff_id: uuid.UUID) -> StaffMember:
        staff = await self.db.get(StaffMember, staff_id)
        if staff is None:
            raise AppError(404, "STAFF_NOT_FOUND", "Сотрудник не найден")
        return staff

    async def _active_owner_count(self, excluding: uuid.UUID | None = None) -> int:
        query = (
            select(func.count())
            .select_from(StaffRole)
            .join(StaffMember, StaffMember.id == StaffRole.staff_id)
            .where(StaffRole.role == "OWNER", StaffMember.status == "active")
        )
        if excluding is not None:
            query = query.where(StaffMember.id != excluding)
        return (await self.db.execute(query)).scalar_one()

    async def set_roles(self, actor: StaffContext, staff_id: uuid.UUID, roles: list[str], meta: RequestMeta) -> None:
        roles = validate_roles(roles)
        staff = await self._get(staff_id)
        before = await roles_of(self.db, staff.id)
        if staff.id == actor.staff.id:
            raise AppError(409, "SELF_ROLE_CHANGE", "Нельзя менять собственные роли")
        if "OWNER" in before and "OWNER" not in roles and await self._active_owner_count(excluding=staff.id) == 0:
            raise AppError(409, "LAST_OWNER", "Нельзя снять роль с последнего владельца")
        await self.db.execute(delete(StaffRole).where(StaffRole.staff_id == staff.id))
        for role in roles:
            self.db.add(StaffRole(staff_id=staff.id, role=role, granted_by=actor.staff.id, granted_at=utcnow()))
        # New rights apply on the next request; existing sessions are not extended with old rights.
        await write_audit(self.db, actor, "staff.roles_changed", meta, "staff", str(staff.id),
                          details={"before": list(before), "after": roles})
        await self.db.commit()

    async def set_status(self, actor: StaffContext, staff_id: uuid.UUID, disabled: bool, meta: RequestMeta) -> None:
        staff = await self._get(staff_id)
        if staff.id == actor.staff.id:
            raise AppError(409, "SELF_DISABLE", "Нельзя отключить собственную учётную запись")
        if disabled:
            if "OWNER" in await roles_of(self.db, staff.id) and await self._active_owner_count(excluding=staff.id) == 0:
                raise AppError(409, "LAST_OWNER", "Нельзя отключить последнего владельца")
            staff.status = "disabled"
            await self._revoke_sessions(staff.id)
        else:
            if staff.password_hash is None:
                raise AppError(409, "NOT_ACCEPTED", "Сотрудник ещё не принял приглашение")
            staff.status = "active"
        await write_audit(self.db, actor, "staff.disabled" if disabled else "staff.enabled", meta, "staff", str(staff.id))
        await self.db.commit()

    async def revoke_sessions(self, actor: StaffContext, staff_id: uuid.UUID, meta: RequestMeta) -> None:
        staff = await self._get(staff_id)
        await self._revoke_sessions(staff.id)
        await write_audit(self.db, actor, "staff.sessions_revoked", meta, "staff", str(staff.id))
        await self.db.commit()

    async def _revoke_sessions(self, staff_id: uuid.UUID) -> None:
        await self.db.execute(
            update(StaffSession)
            .where(StaffSession.staff_id == staff_id, StaffSession.revoked_at.is_(None))
            .values(revoked_at=utcnow())
        )


def staff_out(staff: StaffMember, roles: tuple[str, ...]) -> dict[str, Any]:
    return {
        "id": str(staff.id),
        "email": staff.email,
        "name": staff.name,
        "status": staff.status,
        "roles": list(roles),
        "mfa_enabled": staff.totp_enabled,
        "created_at": staff.created_at,
        "last_sign_in_at": staff.last_sign_in_at,
    }


def iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None
