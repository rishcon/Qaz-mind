import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field

from app.admin.service import StaffContext, staff_out
from app.api.v1.admin.deps import MetaDep, ServiceDep, require

router = APIRouter(prefix="/staff", tags=["admin-staff"])
Owner = Annotated[StaffContext, Depends(require("staff.manage"))]


class InviteIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    roles: list[str] = Field(min_length=1, max_length=7)


class RolesIn(BaseModel):
    roles: list[str] = Field(min_length=1, max_length=7)


@router.get("")
async def list_staff(ctx: Owner, service: ServiceDep) -> dict:
    return {"items": [staff_out(m, roles) for m, roles in await service.list_staff()]}


@router.post("/invitations", status_code=201)
async def invite(body: InviteIn, ctx: Owner, service: ServiceDep, meta: MetaDep) -> dict:
    await service.create_invitation(body.email, body.name, body.roles, ctx, meta)
    return {"status": "invited"}


@router.put("/{staff_id}/roles")
async def set_roles(staff_id: uuid.UUID, body: RolesIn, ctx: Owner, service: ServiceDep, meta: MetaDep) -> dict:
    await service.set_roles(ctx, staff_id, body.roles, meta)
    return {"status": "updated"}


@router.post("/{staff_id}/disable")
async def disable(staff_id: uuid.UUID, ctx: Owner, service: ServiceDep, meta: MetaDep) -> dict:
    await service.set_status(ctx, staff_id, True, meta)
    return {"status": "disabled"}


@router.post("/{staff_id}/enable")
async def enable(staff_id: uuid.UUID, ctx: Owner, service: ServiceDep, meta: MetaDep) -> dict:
    await service.set_status(ctx, staff_id, False, meta)
    return {"status": "active"}


@router.post("/{staff_id}/sessions/revoke")
async def revoke(staff_id: uuid.UUID, ctx: Owner, service: ServiceDep, meta: MetaDep) -> dict:
    await service.revoke_sessions(ctx, staff_id, meta)
    return {"status": "revoked"}
