"""The platform's view of schools: one school in detail, its status, and the teachers and assignments of all schools."""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.service import StaffContext, write_audit
from app.api.deps import get_db
from app.api.v1.admin.deps import MetaDep, require
from app.core.errors import AppError
from app.models import (
    Assignment,
    AssignmentAttempt,
    AssignmentClass,
    ClassMember,
    LicenseSeat,
    Organization,
    OrganizationApplication,
    OrganizationLicense,
    OrganizationMember,
    SchoolClass,
    User,
)
from app.core.time import utcnow

router = APIRouter(tags=["admin-schools"])


async def _licenses(db: AsyncSession, org_id: uuid.UUID) -> list[dict]:
    now = utcnow()
    rows = (
        await db.execute(
            select(OrganizationLicense).where(OrganizationLicense.organization_id == org_id).order_by(OrganizationLicense.starts_at.desc())
        )
    ).scalars()
    out = []
    for lic in rows:
        used = (
            await db.scalar(
                select(func.count()).select_from(LicenseSeat).where(LicenseSeat.license_id == lic.id, LicenseSeat.revoked_at.is_(None))
            )
            or 0
        )
        out.append(
            {
                "id": str(lic.id),
                "plan": lic.plan,
                "seat_limit": lic.seat_limit,
                "seats_used": used,
                "starts_at": lic.starts_at.isoformat(),
                "expires_at": lic.expires_at.isoformat(),
                "status": lic.status,
                "current": lic.status == "active" and lic.starts_at <= now < lic.expires_at,
            }
        )
    return out


@router.get("/organizations/{org_id}")
async def organization_detail(
    org_id: uuid.UUID,
    ctx: Annotated[StaffContext, Depends(require("schools.read"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """One school as the platform sees it: people, classes, licences and the application it came from."""
    organization = await db.get(Organization, org_id)
    if organization is None:
        raise AppError(404, "NOT_FOUND", "Организация не найдена")
    people = (
        await db.execute(
            select(OrganizationMember, User)
            .join(User, User.id == OrganizationMember.user_id)
            .where(OrganizationMember.organization_id == org_id)
            .order_by(OrganizationMember.role, User.name)
        )
    ).all()
    classes = (await db.execute(select(SchoolClass).where(SchoolClass.organization_id == org_id).order_by(SchoolClass.name))).scalars().all()
    counts = {
        (cid, role): n
        for cid, role, n in (
            await db.execute(
                select(ClassMember.class_id, ClassMember.role, func.count())
                .where(ClassMember.class_id.in_([c.id for c in classes] or [uuid.uuid4()]), ClassMember.status == "active")
                .group_by(ClassMember.class_id, ClassMember.role)
            )
        ).all()
    }
    application = (
        await db.execute(select(OrganizationApplication).where(OrganizationApplication.organization_id == org_id))
    ).scalar_one_or_none()
    assignments = (
        await db.execute(select(Assignment.status, func.count()).where(Assignment.organization_id == org_id).group_by(Assignment.status))
    ).all()
    return {
        "organization": {
            "id": str(organization.id),
            "name": organization.name,
            "type": organization.type,
            "city": organization.city,
            "status": organization.status,
            "created_at": organization.created_at.isoformat(),
        },
        "people": [
            {"user_id": str(u.id), "name": u.name, "email": u.email, "role": m.role, "status": m.status} for m, u in people
        ],
        "classes": [
            {
                "id": str(c.id),
                "name": c.name,
                "academic_year": c.academic_year,
                "status": c.status,
                "student_count": counts.get((c.id, "student"), 0),
                "teacher_count": counts.get((c.id, "teacher"), 0),
            }
            for c in classes
        ],
        "licenses": await _licenses(db, org_id),
        "assignments": {status: n for status, n in assignments},
        "application": None
        if application is None
        else {
            "contact_name": application.contact_name,
            "contact_position": application.contact_position,
            "contact_phone": application.contact_phone,
            "approx_students": application.approx_students,
            "created_at": application.created_at.isoformat(),
        },
    }


class StatusIn(BaseModel):
    status: Literal["active", "suspended", "archived"]
    reason: str = Field(default="", max_length=1000)


@router.post("/organizations/{org_id}/status")
async def set_organization_status(
    org_id: uuid.UUID,
    body: StatusIn,
    ctx: Annotated[StaffContext, Depends(require("schools.approve"))],
    meta: MetaDep,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    organization = await db.get(Organization, org_id)
    if organization is None:
        raise AppError(404, "NOT_FOUND", "Организация не найдена")
    if body.status != "active" and len(body.reason.strip()) < 5:
        raise AppError(422, "REASON_REQUIRED", "Укажите причину (не короче 5 символов)")
    previous = organization.status
    organization.status = body.status
    await write_audit(
        db, ctx, "organization.status", meta, "organization", str(org_id),
        {"from": previous, "to": body.status, "reason": body.reason.strip()},
    )
    await db.commit()
    return {"status": organization.status}


@router.get("/teachers")
async def list_teachers(
    ctx: Annotated[StaffContext, Depends(require("schools.read"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """Teachers and school administrators of every school."""
    rows = (
        await db.execute(
            select(OrganizationMember, User, Organization)
            .join(User, User.id == OrganizationMember.user_id)
            .join(Organization, Organization.id == OrganizationMember.organization_id)
            .where(OrganizationMember.status == "active")
            .order_by(Organization.name, OrganizationMember.role, User.name)
        )
    ).all()
    class_counts = dict(
        (
            await db.execute(
                select(ClassMember.user_id, func.count())
                .where(ClassMember.role == "teacher", ClassMember.status == "active")
                .group_by(ClassMember.user_id)
            )
        ).all()
    )
    return {
        "items": [
            {
                "user_id": str(u.id),
                "name": u.name,
                "email": u.email,
                "role": m.role,
                "organization_id": str(o.id),
                "organization_name": o.name,
                "organization_status": o.status,
                "class_count": class_counts.get(u.id, 0) if m.role == "TEACHER" else None,
                "joined_at": m.joined_at.isoformat(),
            }
            for m, u, o in rows
        ]
    }


@router.get("/assignments")
async def list_assignments(
    ctx: Annotated[StaffContext, Depends(require("schools.read"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    """School assignments of every school. No student answers: only status and counts."""
    rows = (
        await db.execute(
            select(Assignment, Organization, User)
            .join(Organization, Organization.id == Assignment.organization_id)
            .join(User, User.id == Assignment.created_by_user_id)
            .order_by(Assignment.created_at.desc())
            .limit(500)
        )
    ).all()
    submitted = dict(
        (
            await db.execute(
                select(AssignmentAttempt.assignment_id, func.count(func.distinct(AssignmentAttempt.student_id)))
                .where(AssignmentAttempt.submitted_at.is_not(None))
                .group_by(AssignmentAttempt.assignment_id)
            )
        ).all()
    )
    class_counts = dict(
        (await db.execute(select(AssignmentClass.assignment_id, func.count()).group_by(AssignmentClass.assignment_id))).all()
    )
    return {
        "items": [
            {
                "id": str(a.id),
                "title": a.title,
                "subject_id": a.subject_id,
                "status": a.status,
                "question_count": a.question_count,
                "organization_id": str(o.id),
                "organization_name": o.name,
                "created_by": u.name,
                "due_at": a.due_at.isoformat() if a.due_at else None,
                "class_count": class_counts.get(a.id, 0),
                "submitted_students": submitted.get(a.id, 0),
                "created_at": a.created_at.isoformat(),
            }
            for a, o, u in rows
        ]
    }
