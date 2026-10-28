"""Invitations, class codes, join requests, students of a class and licence overview.

As everywhere in the school module, access comes from the caller's active membership in the organization,
never from an id sent by the client.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentDep, get_db, get_mailer, get_settings
from app.core.config import Settings
from app.core.errors import AppError
from app.models import ClassMember, JoinRequest, SchoolClass
from app.schemas.school_access import (
    AcceptIn,
    AcceptOut,
    ClassJoinRequestOut,
    ClassStudentOut,
    InvitationIn,
    InvitationOut,
    JoinCodeIn,
    JoinCodeOut,
    JoinRequestIn,
    JoinRequestOut,
    LicenseOut,
    MyClassOut,
)
from app.services.mail import Mailer
from app.services.school import SchoolService
from app.services.school_access import SchoolAccessService

router = APIRouter(tags=["school"])


def get_access_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    mailer: Annotated[Mailer, Depends(get_mailer)],
) -> SchoolAccessService:
    return SchoolAccessService(db, settings, mailer)


AccessDep = Annotated[SchoolAccessService, Depends(get_access_service)]
ADMIN = ("SCHOOL_ADMIN",)


def _school(access: SchoolAccessService) -> SchoolService:
    return SchoolService(access.db)


async def _assigned(access: SchoolAccessService, org_id: uuid.UUID, user_id: uuid.UUID) -> set[uuid.UUID]:
    rows = await access.db.execute(
        select(ClassMember.class_id)
        .join(SchoolClass, SchoolClass.id == ClassMember.class_id)
        .where(
            SchoolClass.organization_id == org_id,
            ClassMember.user_id == user_id,
            ClassMember.role == "teacher",
            ClassMember.status == "active",
        )
    )
    return set(rows.scalars())


def _code_out(code, raw: str | None = None) -> JoinCodeOut:
    return JoinCodeOut(
        id=code.id,
        code_hint=code.code_hint,
        expires_at=code.expires_at,
        max_uses=code.max_uses,
        uses_count=code.uses_count,
        revoked=code.revoked_at is not None,
        code=raw,
    )


# ----- invitations ------------------------------------------------------------------------------------------


@router.get("/organizations/{org_id}/invitations", response_model=list[InvitationOut])
async def list_invitations(org_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> list[InvitationOut]:
    await _school(access).member_of(ctx.user.id, org_id, ADMIN)
    return [InvitationOut.model_validate(i, from_attributes=True) for i in await access.list_invitations(org_id)]


@router.post("/organizations/{org_id}/invitations", response_model=InvitationOut, status_code=201)
async def create_invitation(org_id: uuid.UUID, body: InvitationIn, ctx: CurrentDep, access: AccessDep) -> InvitationOut:
    school = _school(access)
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    assigned = await _assigned(access, org_id, ctx.user.id)
    invitation = await access.invite(member, organization, ctx.user.id, body, assigned)
    return InvitationOut.model_validate(invitation, from_attributes=True)


@router.post("/organizations/{org_id}/invitations/{invitation_id}/resend", response_model=InvitationOut)
async def resend_invitation(org_id: uuid.UUID, invitation_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> InvitationOut:
    school = _school(access)
    organization, _ = await school.member_of(ctx.user.id, org_id, ADMIN)
    school.require_active(organization)
    return InvitationOut.model_validate(await access.resend(organization, invitation_id), from_attributes=True)


@router.post("/organizations/{org_id}/invitations/{invitation_id}/revoke", response_model=InvitationOut)
async def revoke_invitation(org_id: uuid.UUID, invitation_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> InvitationOut:
    await _school(access).member_of(ctx.user.id, org_id, ADMIN)
    return InvitationOut.model_validate(await access.revoke(org_id, invitation_id), from_attributes=True)


@router.post("/invitations/accept", response_model=AcceptOut)
async def accept_invitation(body: AcceptIn, ctx: CurrentDep, access: AccessDep) -> AcceptOut:
    return await access.accept(ctx.user, body.token)


# ----- class codes and join requests ------------------------------------------------------------------------


@router.get("/organizations/{org_id}/classes/{class_id}/join-codes", response_model=list[JoinCodeOut])
async def list_join_codes(org_id: uuid.UUID, class_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> list[JoinCodeOut]:
    school = _school(access)
    _, member = await school.member_of(ctx.user.id, org_id)
    await school.get_class(org_id, class_id, member)
    return [_code_out(c) for c in await access.list_codes(class_id)]


@router.post("/organizations/{org_id}/classes/{class_id}/join-codes", response_model=JoinCodeOut, status_code=201)
async def create_join_code(
    org_id: uuid.UUID, class_id: uuid.UUID, body: JoinCodeIn, ctx: CurrentDep, access: AccessDep
) -> JoinCodeOut:
    school = _school(access)
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    school_class = await school.get_class(org_id, class_id, member)
    code, raw = await access.create_code(school_class, ctx.user.id, body)
    return _code_out(code, raw)


@router.post("/organizations/{org_id}/classes/{class_id}/join-codes/{code_id}/revoke", response_model=JoinCodeOut)
async def revoke_join_code(
    org_id: uuid.UUID, class_id: uuid.UUID, code_id: uuid.UUID, ctx: CurrentDep, access: AccessDep
) -> JoinCodeOut:
    school = _school(access)
    _, member = await school.member_of(ctx.user.id, org_id)
    await school.get_class(org_id, class_id, member)
    return _code_out(await access.revoke_code(class_id, code_id))


@router.post("/classes/join-requests", response_model=JoinRequestOut, status_code=201)
async def request_to_join(body: JoinRequestIn, ctx: CurrentDep, access: AccessDep) -> JoinRequestOut:
    request = await access.request_join(ctx.user, body.code)
    return (await _my_request_out(access, ctx.user.id, request.id))


async def _my_request_out(access: SchoolAccessService, user_id: uuid.UUID, request_id: uuid.UUID) -> JoinRequestOut:
    for r, c, o in await access.my_requests(user_id):
        if r.id == request_id:
            return JoinRequestOut(id=r.id, status=r.status, class_id=c.id, class_name=c.name, organization_name=o.name, created_at=r.created_at)
    raise AppError(404, "NOT_FOUND", "Заявка не найдена")


@router.get("/me/join-requests", response_model=list[JoinRequestOut])
async def my_join_requests(ctx: CurrentDep, access: AccessDep) -> list[JoinRequestOut]:
    return [
        JoinRequestOut(id=r.id, status=r.status, class_id=c.id, class_name=c.name, organization_name=o.name, created_at=r.created_at)
        for r, c, o in await access.my_requests(ctx.user.id)
    ]


@router.get("/me/school-classes", response_model=list[MyClassOut])
async def my_school_classes(ctx: CurrentDep, access: AccessDep) -> list[MyClassOut]:
    return await access.my_classes(ctx.user.id)


@router.get("/organizations/{org_id}/classes/{class_id}/join-requests", response_model=list[ClassJoinRequestOut])
async def class_join_requests(org_id: uuid.UUID, class_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> list[ClassJoinRequestOut]:
    school = _school(access)
    _, member = await school.member_of(ctx.user.id, org_id)
    await school.get_class(org_id, class_id, member)
    return await access.class_requests(class_id)


async def _decide(request_id: uuid.UUID, ctx, access: SchoolAccessService, approve: bool) -> dict:
    request = await access.db.get(JoinRequest, request_id)
    school_class = await access.db.get(SchoolClass, request.class_id) if request else None
    if school_class is None:
        raise AppError(404, "NOT_FOUND", "Заявка не найдена")
    school = _school(access)
    organization, member = await school.member_of(ctx.user.id, school_class.organization_id)
    school.require_active(organization)
    allowed = None if member.role == "SCHOOL_ADMIN" else await _assigned(access, organization.id, ctx.user.id)
    decided = await access.decide(organization.id, request_id, ctx.user.id, approve, allowed)
    return {"status": decided.status}


@router.post("/classes/join-requests/{request_id}/approve")
async def approve_join_request(request_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> dict:
    return await _decide(request_id, ctx, access, True)


@router.post("/classes/join-requests/{request_id}/reject")
async def reject_join_request(request_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> dict:
    return await _decide(request_id, ctx, access, False)


# ----- students and licences --------------------------------------------------------------------------------


@router.get("/organizations/{org_id}/classes/{class_id}/students", response_model=list[ClassStudentOut])
async def class_students(org_id: uuid.UUID, class_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> list[ClassStudentOut]:
    school = _school(access)
    _, member = await school.member_of(ctx.user.id, org_id)
    await school.get_class(org_id, class_id, member)
    return await access.students(class_id)


@router.post("/organizations/{org_id}/classes/{class_id}/students/{user_id}/remove", status_code=204)
async def remove_student(org_id: uuid.UUID, class_id: uuid.UUID, user_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> None:
    school = _school(access)
    organization, member = await school.member_of(ctx.user.id, org_id)
    school.require_active(organization)
    await school.get_class(org_id, class_id, member)
    await access.remove_student(org_id, class_id, user_id)
    await access.db.commit()


@router.get("/organizations/{org_id}/licenses", response_model=list[LicenseOut])
async def organization_licenses(org_id: uuid.UUID, ctx: CurrentDep, access: AccessDep) -> list[LicenseOut]:
    await _school(access).member_of(ctx.user.id, org_id, ADMIN)
    return await access.licenses(org_id)

