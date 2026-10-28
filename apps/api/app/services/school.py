import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.time import utcnow
from app.models import (
    ClassMember,
    Organization,
    OrganizationApplication,
    OrganizationMember,
    SchoolClass,
    User,
)
from app.schemas.school import ApplicationIn, ClassIn, ClassOut, ClassPatch, TeacherOut


def _not_found() -> AppError:
    # The same answer for "no such school" and "not your school": the existence of other schools is not disclosed.
    return AppError(404, "NOT_FOUND", "Организация не найдена")


class SchoolService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ----- applications -------------------------------------------------------------------------------------

    async def apply(self, user: User, body: ApplicationIn) -> OrganizationApplication:
        application = OrganizationApplication(applicant_user_id=user.id, **body.model_dump())
        self.db.add(application)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "APPLICATION_PENDING", "Ваша предыдущая заявка ещё рассматривается") from None
        return application

    async def my_applications(self, user_id: uuid.UUID) -> list[OrganizationApplication]:
        rows = await self.db.execute(
            select(OrganizationApplication)
            .where(OrganizationApplication.applicant_user_id == user_id)
            .order_by(OrganizationApplication.created_at.desc())
        )
        return list(rows.scalars())

    async def list_applications(self, status: str | None) -> list[tuple[OrganizationApplication, User]]:
        query = (
            select(OrganizationApplication, User)
            .join(User, User.id == OrganizationApplication.applicant_user_id)
            .order_by(OrganizationApplication.created_at.desc())
        )
        if status:
            query = query.where(OrganizationApplication.status == status)
        return [(a, u) for a, u in (await self.db.execute(query)).all()]

    async def _pending(self, application_id: uuid.UUID) -> OrganizationApplication:
        application = await self.db.get(OrganizationApplication, application_id, with_for_update=True)
        if application is None:
            raise AppError(404, "NOT_FOUND", "Заявка не найдена")
        if application.status != "pending":
            raise AppError(409, "ALREADY_DECIDED", "По заявке уже принято решение")
        return application

    async def approve(self, application_id: uuid.UUID, staff_id: uuid.UUID) -> OrganizationApplication:
        """One transaction: the organization, its first administrator and the decision appear together."""
        application = await self._pending(application_id)
        organization = Organization(name=application.school_name, type=application.type, city=application.city)
        self.db.add(organization)
        await self.db.flush()
        self.db.add(
            OrganizationMember(
                organization_id=organization.id, user_id=application.applicant_user_id, role="SCHOOL_ADMIN"
            )
        )
        application.status = "approved"
        application.organization_id = organization.id
        application.reviewed_by_staff_id = staff_id
        application.reviewed_at = utcnow()
        return application

    async def reject(self, application_id: uuid.UUID, staff_id: uuid.UUID, reason: str) -> OrganizationApplication:
        application = await self._pending(application_id)
        application.status = "rejected"
        application.rejection_reason = reason
        application.reviewed_by_staff_id = staff_id
        application.reviewed_at = utcnow()
        return application

    # ----- access -------------------------------------------------------------------------------------------

    async def memberships(self, user_id: uuid.UUID) -> list[tuple[Organization, str]]:
        rows = await self.db.execute(
            select(Organization, OrganizationMember.role)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(OrganizationMember.user_id == user_id, OrganizationMember.status == "active")
            .order_by(Organization.name)
        )
        return [(o, r) for o, r in rows.all()]

    async def member_of(
        self, user_id: uuid.UUID, org_id: uuid.UUID, roles: tuple[str, ...] = ("SCHOOL_ADMIN", "TEACHER")
    ) -> tuple[Organization, OrganizationMember]:
        """The organization and the caller's active membership; 404 for strangers, 403 for a role that is too low."""
        row = (
            await self.db.execute(
                select(Organization, OrganizationMember)
                .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
                .where(
                    Organization.id == org_id,
                    OrganizationMember.user_id == user_id,
                    OrganizationMember.status == "active",
                )
            )
        ).first()
        if row is None:
            raise _not_found()
        organization, member = row
        if member.role not in roles:
            raise AppError(403, "FORBIDDEN", "Недостаточно прав для этого действия")
        return organization, member

    @staticmethod
    def require_active(organization: Organization) -> None:
        if organization.status != "active":
            raise AppError(403, "ORGANIZATION_NOT_ACTIVE", "Организация приостановлена или в архиве")

    # ----- classes ------------------------------------------------------------------------------------------

    async def _class_out(self, classes: list[SchoolClass]) -> list[ClassOut]:
        if not classes:
            return []
        counts = {
            (cid, role): n
            for cid, role, n in (
                await self.db.execute(
                    select(ClassMember.class_id, ClassMember.role, func.count())
                    .where(ClassMember.class_id.in_([c.id for c in classes]), ClassMember.status == "active")
                    .group_by(ClassMember.class_id, ClassMember.role)
                )
            ).all()
        }
        return [
            ClassOut(
                id=c.id,
                name=c.name,
                academic_year=c.academic_year,
                grade=c.grade,
                status=c.status,
                student_count=counts.get((c.id, "student"), 0),
                teacher_count=counts.get((c.id, "teacher"), 0),
            )
            for c in classes
        ]

    async def list_classes(self, org_id: uuid.UUID, member: OrganizationMember) -> list[ClassOut]:
        query = select(SchoolClass).where(SchoolClass.organization_id == org_id)
        if member.role != "SCHOOL_ADMIN":
            # A teacher sees only the classes they are explicitly assigned to.
            query = query.join(ClassMember, ClassMember.class_id == SchoolClass.id).where(
                ClassMember.user_id == member.user_id, ClassMember.role == "teacher", ClassMember.status == "active"
            )
        rows = await self.db.execute(
            query.order_by(SchoolClass.academic_year.desc(), SchoolClass.grade, SchoolClass.name)
        )
        return await self._class_out(list(rows.scalars()))

    async def get_class(self, org_id: uuid.UUID, class_id: uuid.UUID, member: OrganizationMember) -> SchoolClass:
        school_class = await self.db.get(SchoolClass, class_id)
        if school_class is None or school_class.organization_id != org_id:
            raise AppError(404, "NOT_FOUND", "Класс не найден")
        if member.role != "SCHOOL_ADMIN":
            assigned = await self.db.scalar(
                select(ClassMember.id).where(
                    ClassMember.class_id == class_id,
                    ClassMember.user_id == member.user_id,
                    ClassMember.role == "teacher",
                    ClassMember.status == "active",
                )
            )
            if assigned is None:
                raise AppError(404, "NOT_FOUND", "Класс не найден")
        return school_class

    async def one_class_out(self, school_class: SchoolClass) -> ClassOut:
        return (await self._class_out([school_class]))[0]

    async def create_class(self, org_id: uuid.UUID, body: ClassIn) -> SchoolClass:
        school_class = SchoolClass(
            organization_id=org_id,
            name=body.name,
            name_key=body.name.casefold(),
            academic_year=body.academic_year,
            grade=body.grade,
        )
        self.db.add(school_class)
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "CLASS_EXISTS", "Класс с таким названием в этом учебном году уже есть") from None
        return school_class

    async def patch_class(self, school_class: SchoolClass, body: ClassPatch) -> SchoolClass:
        if body.name:
            school_class.name = body.name
            school_class.name_key = body.name.casefold()
        if body.status:
            school_class.status = body.status
        try:
            await self.db.commit()
        except IntegrityError:
            await self.db.rollback()
            raise AppError(409, "CLASS_EXISTS", "Класс с таким названием в этом учебном году уже есть") from None
        return school_class

    # ----- teachers -----------------------------------------------------------------------------------------

    async def teachers(self, org_id: uuid.UUID) -> list[TeacherOut]:
        rows = (
            await self.db.execute(
                select(OrganizationMember, User)
                .join(User, User.id == OrganizationMember.user_id)
                .where(OrganizationMember.organization_id == org_id, OrganizationMember.role == "TEACHER")
                .order_by(User.name)
            )
        ).all()
        assigned: dict[uuid.UUID, list[uuid.UUID]] = {}
        links = await self.db.execute(
            select(ClassMember.user_id, ClassMember.class_id)
            .join(SchoolClass, SchoolClass.id == ClassMember.class_id)
            .where(SchoolClass.organization_id == org_id, ClassMember.role == "teacher", ClassMember.status == "active")
        )
        for user_id, class_id in links.all():
            assigned.setdefault(user_id, []).append(class_id)
        return [
            TeacherOut(user_id=u.id, name=u.name, email=u.email, username=u.username, status=m.status, class_ids=assigned.get(u.id, []))
            for m, u in rows
        ]

    async def set_teacher_classes(self, org_id: uuid.UUID, teacher_id: uuid.UUID, class_ids: list[uuid.UUID]) -> None:
        """Replaces the classes of one teacher. Every class must belong to this organization."""
        teacher = await self.db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == teacher_id,
                OrganizationMember.role == "TEACHER",
                OrganizationMember.status == "active",
            )
        )
        if teacher is None:
            raise AppError(404, "NOT_FOUND", "Учитель не найден")
        wanted = set(class_ids)
        own = set((await self.db.execute(select(SchoolClass.id).where(SchoolClass.organization_id == org_id))).scalars())
        if not wanted <= own:
            raise AppError(404, "NOT_FOUND", "Класс не найден")
        existing = {
            m.class_id: m
            for m in (
                await self.db.execute(
                    select(ClassMember).where(
                        ClassMember.user_id == teacher_id, ClassMember.role == "teacher", ClassMember.class_id.in_(own)
                    )
                )
            ).scalars()
        }
        for class_id, link in existing.items():
            link.status = "active" if class_id in wanted else "removed"
        for class_id in wanted - existing.keys():
            self.db.add(ClassMember(class_id=class_id, user_id=teacher_id, role="teacher"))
        await self.db.commit()
