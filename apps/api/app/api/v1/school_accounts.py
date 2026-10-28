"""Logins and passwords created by a school administrator for the teachers and students of the school."""

import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps import CurrentDep
from app.api.v1.school_access import AccessDep
from app.services.school import SchoolService
from app.services.school_accounts import SchoolAccountService

router = APIRouter(tags=["school-accounts"])


class AccountIn(BaseModel):
    role: Literal["SCHOOL_ADMIN", "TEACHER", "STUDENT"]
    name: str = Field(min_length=2, max_length=80)
    # A student belongs to exactly one class; a teacher may get several right away.
    class_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)
    username: str | None = Field(default=None, max_length=40)
    password: str | None = Field(default=None, max_length=128)


class BulkIn(BaseModel):
    class_id: uuid.UUID
    names: list[str] = Field(min_length=1, max_length=200)


def get_accounts(access: AccessDep) -> SchoolAccountService:
    return SchoolAccountService(access.db, access)


AccountsDep = Annotated[SchoolAccountService, Depends(get_accounts)]


async def _admin_org(accounts: SchoolAccountService, ctx, org_id: uuid.UUID):
    school = SchoolService(accounts.db)
    organization, _ = await school.member_of(ctx.user.id, org_id, ("SCHOOL_ADMIN",))
    school.require_active(organization)
    return organization


@router.post("/organizations/{org_id}/accounts", status_code=201)
async def create_account(org_id: uuid.UUID, body: AccountIn, ctx: CurrentDep, accounts: AccountsDep) -> dict:
    organization = await _admin_org(accounts, ctx, org_id)
    return await accounts.create(organization, body.role, " ".join(body.name.split()), body.class_ids, body.username, body.password)


@router.post("/organizations/{org_id}/accounts/bulk", status_code=201)
async def create_students(org_id: uuid.UUID, body: BulkIn, ctx: CurrentDep, accounts: AccountsDep) -> dict:
    organization = await _admin_org(accounts, ctx, org_id)
    return {"items": await accounts.bulk_students(organization, body.class_id, body.names)}


@router.post("/organizations/{org_id}/accounts/{user_id}/reset-password")
async def reset_password(org_id: uuid.UUID, user_id: uuid.UUID, ctx: CurrentDep, accounts: AccountsDep) -> dict:
    await _admin_org(accounts, ctx, org_id)
    return await accounts.reset_password(org_id, user_id)
