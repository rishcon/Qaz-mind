"""Invitations, class codes, join requests and seat licensing of a school.

Rules from the specification: invitation tokens and class codes are random and stored only as hashes; a revoked
or expired invitation never works; an existing person accepts an invitation in their own account and the e-mail
must match; student seats are counted in one transaction under a row lock, so parallel joins cannot exceed
the licence.
"""

import secrets
import uuid
from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import generate_token, hash_token
from app.core.time import utcnow
from app.models import (
    ClassMember,
    Invitation,
    JoinCode,
    JoinRequest,
    LicenseSeat,
    Organization,
    OrganizationLicense,
    OrganizationMember,
    SchoolClass,
    User,
)
from app.schemas.school_access import (
    AcceptOut,
    ClassJoinRequestOut,
    ClassStudentOut,
    InvitationIn,
    JoinCodeIn,
    LicenseOut,
    MyClassOut,
)
from app.services.mail import MailDeliveryError, Mailer, OutgoingEmail

INVITATION_DAYS = 7
CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # no 0/O/1/I


def normalize_code(raw: str) -> str:
    return "".join(ch for ch in raw.upper() if ch.isalnum())


def new_code() -> str:
    raw = "".join(secrets.choice(CODE_ALPHABET) for _ in range(8))
    return f"{raw[:4]}-{raw[4:]}"


class SchoolAccessService:
    def __init__(self, db: AsyncSession, settings: Settings, mailer: Mailer) -> None:
        self.db = db
        self.settings = settings
        self.mailer = mailer

    # ----- licences and seats -------------------------------------------------------------------------------

    async def _seats_used(self, license_id: uuid.UUID) -> int:
        return (
            await self.db.scalar(
                select(func.count()).select_from(LicenseSeat).where(LicenseSeat.license_id == license_id, LicenseSeat.revoked_at.is_(None))
            )
            or 0
        )

    async def licenses(self, org_id: uuid.UUID) -> list[LicenseOut]:
        now = utcnow()
        rows = (
            await self.db.execute(
                select(OrganizationLicense).where(OrganizationLicense.organization_id == org_id).order_by(OrganizationLicense.starts_at.desc())
            )
        ).scalars()
        return [
            LicenseOut(
                id=lic.id,
                plan=lic.plan,
                seat_limit=lic.seat_limit,
                seats_used=await self._seats_used(lic.id),
                starts_at=lic.starts_at,
                expires_at=lic.expires_at,
                status=lic.status,
                current=lic.status == "active" and lic.starts_at <= now < lic.expires_at,
            )
            for lic in rows
        ]

    async def _locked_current_license(self, org_id: uuid.UUID) -> OrganizationLicense | None:
        now = utcnow()
        return (
            await self.db.execute(
                select(OrganizationLicense)
                .where(
                    OrganizationLicense.organization_id == org_id,
                    OrganizationLicense.status == "active",
                    OrganizationLicense.starts_at <= now,
                    OrganizationLicense.expires_at > now,
                )
                .order_by(OrganizationLicense.expires_at.desc())
                .limit(1)
                .with_for_update()
            )
        ).scalar_one_or_none()

    async def ensure_seat(self, org_id: uuid.UUID, user_id: uuid.UUID) -> None:
        """A student needs a seat of the current licence. The licence row is locked while seats are counted."""
        license_ = await self._locked_current_license(org_id)
        if license_ is None:
            raise AppError(409, "NO_LICENSE", "У школы нет действующей лицензии: ученики пока не могут вступать в классы")
        has_seat = await self.db.scalar(
            select(LicenseSeat.id).where(
                LicenseSeat.license_id == license_.id, LicenseSeat.user_id == user_id, LicenseSeat.revoked_at.is_(None)
            )
        )
        if has_seat:
            return
        if await self._seats_used(license_.id) >= license_.seat_limit:
            raise AppError(409, "NO_SEATS", "В лицензии школы не осталось свободных мест")
        self.db.add(LicenseSeat(license_id=license_.id, user_id=user_id))
        await self.db.flush()

    async def add_student(self, org_id: uuid.UUID, class_id: uuid.UUID, user_id: uuid.UUID) -> None:
        link = await self.db.scalar(select(ClassMember).where(ClassMember.class_id == class_id, ClassMember.user_id == user_id))
        if link is not None and link.status == "active" and link.role == "student":
            return
        await self.ensure_seat(org_id, user_id)
        if link is None:
            self.db.add(ClassMember(class_id=class_id, user_id=user_id, role="student"))
        else:
            link.role, link.status, link.joined_at = "student", "active", utcnow()

    async def remove_student(self, org_id: uuid.UUID, class_id: uuid.UUID, user_id: uuid.UUID) -> None:
        link = await self.db.scalar(
            select(ClassMember).where(
                ClassMember.class_id == class_id, ClassMember.user_id == user_id, ClassMember.role == "student", ClassMember.status == "active"
            )
        )
        if link is None:
            raise AppError(404, "NOT_FOUND", "Ученик не найден в этом классе")
        link.status = "removed"
        await self.db.flush()
        other = await self.db.scalar(
            select(ClassMember.id)
            .join(SchoolClass, SchoolClass.id == ClassMember.class_id)
            .where(
                SchoolClass.organization_id == org_id,
                ClassMember.user_id == user_id,
                ClassMember.role == "student",
                ClassMember.status == "active",
            )
        )
        if other is None:
            # The seat is freed only when the person is in no other class of this school. Personal progress is untouched.
            seats = await self.db.execute(
                select(LicenseSeat)
                .join(OrganizationLicense, OrganizationLicense.id == LicenseSeat.license_id)
                .where(OrganizationLicense.organization_id == org_id, LicenseSeat.user_id == user_id, LicenseSeat.revoked_at.is_(None))
            )
            for seat in seats.scalars():
                seat.revoked_at = utcnow()

    # ----- invitations --------------------------------------------------------------------------------------

    def _invitation_mail(self, invitation: Invitation, organization: Organization, raw: str) -> OutgoingEmail:
        link = f"{self.settings.public_app_url}/invite?token={raw}"
        who = {"TEACHER": "учителем", "SCHOOL_ADMIN": "администратором школы"}.get(invitation.role, "учеником")
        return OutgoingEmail(
            to=invitation.email,
            subject=f"QazMind: приглашение в «{organization.name}»",
            text=(
                f"Вас приглашают присоединиться к «{organization.name}» {who} на платформе QazMind.\n\n"
                f"Откройте ссылку, войдите в аккаунт с адресом {invitation.email} (или создайте его) и примите приглашение. "
                f"Ссылка действует {INVITATION_DAYS} дней:\n{link}"
            ),
        )

    async def _send(self, message: OutgoingEmail) -> None:
        try:
            await self.mailer.send(message)
        except MailDeliveryError as error:
            raise AppError(503, "MAIL_UNAVAILABLE", "Приглашение сохранено, но письмо не отправилось. Повторите отправку позже.") from error

    async def invite(
        self, actor: OrganizationMember, organization: Organization, actor_user_id: uuid.UUID, body: InvitationIn, assigned_class_ids: set[uuid.UUID]
    ) -> Invitation:
        if body.role in ("TEACHER", "SCHOOL_ADMIN") and actor.role != "SCHOOL_ADMIN":
            raise AppError(403, "FORBIDDEN", "Учителей и администраторов приглашает администратор школы")
        if body.role == "STUDENT":
            if body.class_id is None:
                raise AppError(422, "CLASS_REQUIRED", "Для приглашения ученика укажите класс")
            if actor.role != "SCHOOL_ADMIN" and body.class_id not in assigned_class_ids:
                raise AppError(404, "NOT_FOUND", "Класс не найден")
        if body.class_id is not None:
            school_class = await self.db.get(SchoolClass, body.class_id)
            if school_class is None or school_class.organization_id != organization.id:
                raise AppError(404, "NOT_FOUND", "Класс не найден")
        duplicate = await self.db.scalar(
            select(Invitation.id).where(
                Invitation.organization_id == organization.id,
                Invitation.email == body.email,
                Invitation.role == body.role,
                Invitation.class_id.is_(body.class_id) if body.class_id is None else Invitation.class_id == body.class_id,
                Invitation.status == "pending",
                Invitation.expires_at > utcnow(),
            )
        )
        if duplicate:
            raise AppError(409, "INVITATION_EXISTS", "Такое приглашение уже отправлено. Отзовите его или отправьте повторно.")
        raw = generate_token()
        invitation = Invitation(
            organization_id=organization.id,
            class_id=body.class_id,
            role=body.role,
            email=body.email,
            token_hash=hash_token(raw),
            expires_at=utcnow() + timedelta(days=INVITATION_DAYS),
            created_by_user_id=actor_user_id,
        )
        self.db.add(invitation)
        await self.db.commit()
        await self._send(self._invitation_mail(invitation, organization, raw))
        return invitation

    async def resend(self, organization: Organization, invitation_id: uuid.UUID) -> Invitation:
        invitation = await self._own_invitation(organization.id, invitation_id)
        if invitation.status != "pending":
            raise AppError(409, "INVITATION_CLOSED", "Приглашение уже принято или отозвано")
        raw = generate_token()
        invitation.token_hash = hash_token(raw)  # the previous link stops working
        invitation.expires_at = utcnow() + timedelta(days=INVITATION_DAYS)
        await self.db.commit()
        await self._send(self._invitation_mail(invitation, organization, raw))
        return invitation

    async def revoke(self, org_id: uuid.UUID, invitation_id: uuid.UUID) -> Invitation:
        invitation = await self._own_invitation(org_id, invitation_id)
        if invitation.status == "pending":
            invitation.status = "revoked"
            await self.db.commit()
        return invitation

    async def _own_invitation(self, org_id: uuid.UUID, invitation_id: uuid.UUID) -> Invitation:
        invitation = await self.db.get(Invitation, invitation_id)
        if invitation is None or invitation.organization_id != org_id:
            raise AppError(404, "NOT_FOUND", "Приглашение не найдено")
        return invitation

    async def list_invitations(self, org_id: uuid.UUID) -> list[Invitation]:
        rows = await self.db.execute(select(Invitation).where(Invitation.organization_id == org_id).order_by(Invitation.created_at.desc()))
        return list(rows.scalars())

    async def accept(self, user: User, raw_token: str) -> AcceptOut:
        invitation = (
            await self.db.execute(select(Invitation).where(Invitation.token_hash == hash_token(raw_token)).with_for_update())
        ).scalar_one_or_none()
        if invitation is None:
            raise AppError(404, "INVITATION_INVALID", "Приглашение не найдено")
        if invitation.status == "revoked":
            raise AppError(410, "INVITATION_REVOKED", "Приглашение отозвано")
        if invitation.status == "accepted":
            raise AppError(410, "INVITATION_USED", "Приглашение уже использовано")
        if invitation.expires_at <= utcnow():
            raise AppError(410, "INVITATION_EXPIRED", "Срок приглашения истёк")
        if invitation.email != user.email:
            raise AppError(403, "INVITATION_EMAIL_MISMATCH", f"Приглашение отправлено на другой адрес. Войдите с адресом {invitation.email}.")
        organization = await self.db.get(Organization, invitation.organization_id)
        if organization is None or organization.status != "active":
            raise AppError(403, "ORGANIZATION_NOT_ACTIVE", "Организация приостановлена или в архиве")

        if invitation.role == "SCHOOL_ADMIN":
            member = await self.db.scalar(
                select(OrganizationMember).where(OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id)
            )
            if member is None:
                self.db.add(OrganizationMember(organization_id=organization.id, user_id=user.id, role="SCHOOL_ADMIN"))
            else:
                member.role, member.status, member.revoked_at = "SCHOOL_ADMIN", "active", None
        elif invitation.role == "TEACHER":
            member = await self.db.scalar(
                select(OrganizationMember).where(OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id)
            )
            if member is None:
                self.db.add(OrganizationMember(organization_id=organization.id, user_id=user.id, role="TEACHER"))
            elif member.status == "revoked":
                member.role, member.status, member.revoked_at, member.joined_at = "TEACHER", "active", None, utcnow()
            # An active member keeps the role they have; an administrator is not downgraded by a teacher invitation.
            if invitation.class_id is not None:
                link = await self.db.scalar(
                    select(ClassMember).where(ClassMember.class_id == invitation.class_id, ClassMember.user_id == user.id)
                )
                if link is None:
                    self.db.add(ClassMember(class_id=invitation.class_id, user_id=user.id, role="teacher"))
                elif link.role == "teacher":
                    link.status = "active"
        else:
            await self.add_student(organization.id, invitation.class_id, user.id)  # type: ignore[arg-type]

        invitation.status = "accepted"
        invitation.accepted_by_user_id = user.id
        invitation.accepted_at = utcnow()
        await self.db.commit()
        return AcceptOut(organization_id=organization.id, role=invitation.role, class_id=invitation.class_id)

    # ----- class codes and join requests --------------------------------------------------------------------

    async def create_code(self, school_class: SchoolClass, actor_user_id: uuid.UUID, body: JoinCodeIn) -> tuple[JoinCode, str]:
        for _ in range(5):
            code = new_code()
            row = JoinCode(
                class_id=school_class.id,
                code_hash=hash_token(normalize_code(code)),
                code_hint=code[-2:],
                expires_at=utcnow() + timedelta(days=body.valid_days),
                max_uses=body.max_uses,
                created_by_user_id=actor_user_id,
            )
            self.db.add(row)
            try:
                await self.db.commit()
                return row, code
            except IntegrityError:
                await self.db.rollback()
        raise AppError(503, "CODE_GENERATION_FAILED", "Не удалось создать код, попробуйте ещё раз")

    async def list_codes(self, class_id: uuid.UUID) -> list[JoinCode]:
        rows = await self.db.execute(select(JoinCode).where(JoinCode.class_id == class_id).order_by(JoinCode.created_at.desc()))
        return list(rows.scalars())

    async def revoke_code(self, class_id: uuid.UUID, code_id: uuid.UUID) -> JoinCode:
        code = await self.db.get(JoinCode, code_id)
        if code is None or code.class_id != class_id:
            raise AppError(404, "NOT_FOUND", "Код не найден")
        if code.revoked_at is None:
            code.revoked_at = utcnow()
            await self.db.commit()
        return code

    async def request_join(self, user: User, raw_code: str) -> JoinRequest:
        invalid = AppError(404, "CODE_INVALID", "Код не найден или больше не действует")
        code = (
            await self.db.execute(select(JoinCode).where(JoinCode.code_hash == hash_token(normalize_code(raw_code))).with_for_update())
        ).scalar_one_or_none()
        if code is None or code.revoked_at is not None or code.expires_at <= utcnow() or code.uses_count >= code.max_uses:
            raise invalid
        school_class = await self.db.get(SchoolClass, code.class_id)
        organization = await self.db.get(Organization, school_class.organization_id) if school_class else None
        if school_class is None or organization is None or school_class.status != "active" or organization.status != "active":
            raise invalid
        already = await self.db.scalar(
            select(ClassMember.id).where(
                ClassMember.class_id == school_class.id, ClassMember.user_id == user.id, ClassMember.status == "active"
            )
        )
        if already:
            raise AppError(409, "ALREADY_MEMBER", "Вы уже состоите в этом классе")
        request = JoinRequest(class_id=school_class.id, user_id=user.id)
        self.db.add(request)
        code.uses_count += 1
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "REQUEST_PENDING", "Заявка в этот класс уже ожидает решения") from None
        return request

    async def my_requests(self, user_id: uuid.UUID) -> list[tuple[JoinRequest, SchoolClass, Organization]]:
        rows = await self.db.execute(
            select(JoinRequest, SchoolClass, Organization)
            .join(SchoolClass, SchoolClass.id == JoinRequest.class_id)
            .join(Organization, Organization.id == SchoolClass.organization_id)
            .where(JoinRequest.user_id == user_id)
            .order_by(JoinRequest.created_at.desc())
        )
        return [(r, c, o) for r, c, o in rows.all()]

    async def class_requests(self, class_id: uuid.UUID) -> list[ClassJoinRequestOut]:
        rows = await self.db.execute(
            select(JoinRequest, User).join(User, User.id == JoinRequest.user_id).where(JoinRequest.class_id == class_id).order_by(JoinRequest.created_at.desc())
        )
        return [
            ClassJoinRequestOut(id=r.id, status=r.status, user_id=u.id, name=u.name, email=u.email, created_at=r.created_at)
            for r, u in rows.all()
        ]

    async def decide(self, org_id: uuid.UUID, request_id: uuid.UUID, actor_user_id: uuid.UUID, approve: bool, allowed_class_ids: set[uuid.UUID] | None) -> JoinRequest:
        """`allowed_class_ids` is None for a school administrator and the teacher's own classes otherwise."""
        request = await self.db.get(JoinRequest, request_id, with_for_update=True)
        school_class = await self.db.get(SchoolClass, request.class_id) if request else None
        if request is None or school_class is None or school_class.organization_id != org_id:
            raise AppError(404, "NOT_FOUND", "Заявка не найдена")
        if allowed_class_ids is not None and school_class.id not in allowed_class_ids:
            raise AppError(404, "NOT_FOUND", "Заявка не найдена")
        if request.status != "pending":
            raise AppError(409, "ALREADY_DECIDED", "По заявке уже принято решение")
        if approve:
            await self.add_student(org_id, school_class.id, request.user_id)
        request.status = "approved" if approve else "rejected"
        request.decided_by_user_id = actor_user_id
        request.decided_at = utcnow()
        await self.db.commit()
        return request

    # ----- members ------------------------------------------------------------------------------------------

    async def revoke_member(self, org_id: uuid.UUID, user_id: uuid.UUID, acting_user_id: uuid.UUID) -> None:
        """Takes a teacher or administrator out of the school. The last administrator cannot be removed."""
        member = await self.db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id, OrganizationMember.user_id == user_id, OrganizationMember.status == "active"
            )
        )
        if member is None:
            raise AppError(404, "NOT_FOUND", "Сотрудник школы не найден")
        if member.role == "SCHOOL_ADMIN":
            admins = await self.db.scalar(
                select(func.count()).select_from(OrganizationMember).where(
                    OrganizationMember.organization_id == org_id, OrganizationMember.role == "SCHOOL_ADMIN", OrganizationMember.status == "active"
                )
            )
            if (admins or 0) <= 1:
                raise AppError(409, "LAST_ADMIN", "Нельзя убрать единственного администратора школы")
        member.status, member.revoked_at = "revoked", utcnow()
        links = await self.db.execute(
            select(ClassMember)
            .join(SchoolClass, SchoolClass.id == ClassMember.class_id)
            .where(SchoolClass.organization_id == org_id, ClassMember.user_id == user_id, ClassMember.role == "teacher")
        )
        for link in links.scalars():
            link.status = "removed"
        await self.db.commit()

    async def org_students(self, org_id: uuid.UUID) -> list[dict]:
        rows = await self.db.execute(
            select(User, SchoolClass)
            .join(ClassMember, ClassMember.user_id == User.id)
            .join(SchoolClass, SchoolClass.id == ClassMember.class_id)
            .where(SchoolClass.organization_id == org_id, ClassMember.role == "student", ClassMember.status == "active")
            .order_by(SchoolClass.name, User.name)
        )
        return [
            {"user_id": str(u.id), "name": u.name, "email": u.email, "username": u.username, "class_id": str(c.id), "class_name": c.name}
            for u, c in rows.all()
        ]


    async def students(self, class_id: uuid.UUID) -> list[ClassStudentOut]:
        rows = await self.db.execute(
            select(ClassMember, User)
            .join(User, User.id == ClassMember.user_id)
            .where(ClassMember.class_id == class_id, ClassMember.role == "student", ClassMember.status == "active")
            .order_by(User.name)
        )
        return [ClassStudentOut(user_id=u.id, name=u.name, email=u.email, username=u.username, joined_at=m.joined_at) for m, u in rows.all()]

    async def my_classes(self, user_id: uuid.UUID) -> list[MyClassOut]:
        rows = await self.db.execute(
            select(SchoolClass, Organization)
            .join(ClassMember, ClassMember.class_id == SchoolClass.id)
            .join(Organization, Organization.id == SchoolClass.organization_id)
            .where(ClassMember.user_id == user_id, ClassMember.role == "student", ClassMember.status == "active")
            .order_by(Organization.name, SchoolClass.name)
        )
        return [
            MyClassOut(class_id=c.id, class_name=c.name, academic_year=c.academic_year, organization_id=o.id, organization_name=o.name)
            for c, o in rows.all()
        ]
