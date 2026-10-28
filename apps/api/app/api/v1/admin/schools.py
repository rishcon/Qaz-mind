"""Moderation of school applications and the list of organizations (platform staff only)."""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.service import StaffContext, write_audit
from app.api.deps import get_db
from app.api.v1.admin.deps import MetaDep, require
from app.core.time import utcnow
from app.models import ClassMember, LicenseSeat, Organization, OrganizationLicense, OrganizationMember, SchoolClass
from app.schemas.school import ApplicationOut, RejectIn
from app.services.school import SchoolService

router = APIRouter(tags=["admin-schools"])


def _row(application, applicant) -> dict:
    out = ApplicationOut.model_validate(application).model_dump(mode="json")
    out["applicant"] = {"id": str(applicant.id), "name": applicant.name, "email": applicant.email}
    return out


@router.get("/school-applications")
async def list_applications(
    ctx: Annotated[StaffContext, Depends(require("schools.read"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    status: Literal["pending", "approved", "rejected"] | None = Query(default=None),
) -> dict:
    rows = await SchoolService(db).list_applications(status)
    return {"items": [_row(a, u) for a, u in rows]}


@router.post("/school-applications/{application_id}/approve")
async def approve_application(
    application_id: uuid.UUID,
    ctx: Annotated[StaffContext, Depends(require("schools.approve"))],
    meta: MetaDep,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    application = await SchoolService(db).approve(application_id, ctx.staff.id)
    await write_audit(
        db,
        ctx,
        "school_application.approve",
        meta,
        "organization_application",
        str(application.id),
        {"organization_id": str(application.organization_id), "school_name": application.school_name},
    )
    await db.commit()
    return {"status": application.status, "organization_id": str(application.organization_id)}


@router.post("/school-applications/{application_id}/reject")
async def reject_application(
    application_id: uuid.UUID,
    body: RejectIn,
    ctx: Annotated[StaffContext, Depends(require("schools.approve"))],
    meta: MetaDep,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    application = await SchoolService(db).reject(application_id, ctx.staff.id, body.reason)
    await write_audit(
        db,
        ctx,
        "school_application.reject",
        meta,
        "organization_application",
        str(application.id),
        {"reason": body.reason, "school_name": application.school_name},
    )
    await db.commit()
    return {"status": application.status}


@router.get("/organizations")
async def list_organizations(
    ctx: Annotated[StaffContext, Depends(require("schools.read"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict:
    classes = dict(
        (await db.execute(select(SchoolClass.organization_id, func.count()).group_by(SchoolClass.organization_id))).all()
    )
    teachers = dict(
        (
            await db.execute(
                select(OrganizationMember.organization_id, func.count())
                .where(OrganizationMember.role == "TEACHER", OrganizationMember.status == "active")
                .group_by(OrganizationMember.organization_id)
            )
        ).all()
    )
    students = dict(
        (
            await db.execute(
                select(SchoolClass.organization_id, func.count(func.distinct(ClassMember.user_id)))
                .join(ClassMember, ClassMember.class_id == SchoolClass.id)
                .where(ClassMember.role == "student", ClassMember.status == "active")
                .group_by(SchoolClass.organization_id)
            )
        ).all()
    )
    organizations = (await db.execute(select(Organization).order_by(Organization.name))).scalars().all()
    now = utcnow()
    used = dict(
        (
            await db.execute(
                select(LicenseSeat.license_id, func.count()).where(LicenseSeat.revoked_at.is_(None)).group_by(LicenseSeat.license_id)
            )
        ).all()
    )
    current: dict = {}
    for lic in (
        await db.execute(
            select(OrganizationLicense)
            .where(OrganizationLicense.status == "active", OrganizationLicense.starts_at <= now, OrganizationLicense.expires_at > now)
            .order_by(OrganizationLicense.expires_at)
        )
    ).scalars():
        current[lic.organization_id] = lic  # the one that ends last wins
    return {
        "items": [
            {
                "id": str(o.id),
                "name": o.name,
                "type": o.type,
                "city": o.city,
                "status": o.status,
                "created_at": o.created_at.isoformat(),
                "class_count": classes.get(o.id, 0),
                "teacher_count": teachers.get(o.id, 0),
                "student_count": students.get(o.id, 0),
                "license": None
                if o.id not in current
                else {
                    "plan": current[o.id].plan,
                    "seat_limit": current[o.id].seat_limit,
                    "seats_used": used.get(current[o.id].id, 0),
                    "expires_at": current[o.id].expires_at.isoformat(),
                },
            }
            for o in organizations
        ]
    }
