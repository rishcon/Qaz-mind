"""Seat licences of organizations. Recording a licence does not charge anyone: payments are not connected."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.admin.service import StaffContext, write_audit
from app.api.deps import get_db, get_mailer, get_settings
from app.api.v1.admin.deps import MetaDep, require
from app.core.errors import AppError
from app.models import Organization, OrganizationLicense
from app.schemas.school_access import LicenseIn, LicenseOut
from app.services.school_access import SchoolAccessService

router = APIRouter(tags=["admin-licenses"])


def _service(db, settings, mailer) -> SchoolAccessService:
    return SchoolAccessService(db, settings, mailer)


@router.get("/organizations/{org_id}/licenses", response_model=list[LicenseOut])
async def list_licenses(
    org_id: uuid.UUID,
    ctx: Annotated[StaffContext, Depends(require("schools.read"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    settings=Depends(get_settings),
    mailer=Depends(get_mailer),
) -> list[LicenseOut]:
    return await _service(db, settings, mailer).licenses(org_id)


@router.post("/organizations/{org_id}/licenses", response_model=LicenseOut, status_code=201)
async def create_license(
    org_id: uuid.UUID,
    body: LicenseIn,
    ctx: Annotated[StaffContext, Depends(require("finance.manage"))],
    meta: MetaDep,
    db: Annotated[AsyncSession, Depends(get_db)],
    settings=Depends(get_settings),
    mailer=Depends(get_mailer),
) -> LicenseOut:
    if await db.get(Organization, org_id) is None:
        raise AppError(404, "NOT_FOUND", "Организация не найдена")
    if body.expires_at <= body.starts_at:
        raise AppError(422, "PERIOD_INVALID", "Срок окончания должен быть позже начала")
    license_ = OrganizationLicense(
        organization_id=org_id, plan=body.plan, seat_limit=body.seat_limit, starts_at=body.starts_at, expires_at=body.expires_at
    )
    db.add(license_)
    await db.flush()
    await write_audit(
        db, ctx, "license.create", meta, "organization", str(org_id),
        {"license_id": str(license_.id), "plan": body.plan, "seat_limit": body.seat_limit},
    )
    await db.commit()
    return next(item for item in await _service(db, settings, mailer).licenses(org_id) if item.id == license_.id)


@router.post("/organizations/{org_id}/licenses/{license_id}/cancel", response_model=LicenseOut)
async def cancel_license(
    org_id: uuid.UUID,
    license_id: uuid.UUID,
    ctx: Annotated[StaffContext, Depends(require("finance.manage"))],
    meta: MetaDep,
    db: Annotated[AsyncSession, Depends(get_db)],
    settings=Depends(get_settings),
    mailer=Depends(get_mailer),
) -> LicenseOut:
    license_ = await db.get(OrganizationLicense, license_id)
    if license_ is None or license_.organization_id != org_id:
        raise AppError(404, "NOT_FOUND", "Лицензия не найдена")
    license_.status = "cancelled"
    await write_audit(db, ctx, "license.cancel", meta, "organization", str(org_id), {"license_id": str(license_id)})
    await db.commit()
    return next(item for item in await _service(db, settings, mailer).licenses(org_id) if item.id == license_id)
