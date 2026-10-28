"""School-side endpoints for a signed-in person: applications, own organizations, classes and teachers.

The caller is always the user of the session. An organization id in the path is never proof of access:
every request checks the caller's active membership and role in that organization.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentDep, get_db
from app.schemas.school import (
    ApplicationIn,
    ApplicationOut,
    ClassIn,
    ClassOut,
    ClassPatch,
    MembershipOut,
    OrganizationOut,
    TeacherClassesIn,
    TeacherOut,
)
from app.services.school import SchoolService

router = APIRouter(tags=["school"])


def get_school_service(db: Annotated[AsyncSession, Depends(get_db)]) -> SchoolService:
    return SchoolService(db)


SchoolDep = Annotated[SchoolService, Depends(get_school_service)]
ADMIN = ("SCHOOL_ADMIN",)


@router.post("/school-applications", response_model=ApplicationOut, status_code=201)
async def submit_application(body: ApplicationIn, ctx: CurrentDep, school: SchoolDep) -> ApplicationOut:
    return await school.apply(ctx.user, body)


@router.get("/school-applications/mine", response_model=list[ApplicationOut])
async def my_applications(ctx: CurrentDep, school: SchoolDep) -> list[ApplicationOut]:
    return await school.my_applications(ctx.user.id)


@router.get("/me/organizations", response_model=list[MembershipOut])
async def my_organizations(ctx: CurrentDep, school: SchoolDep) -> list[MembershipOut]:
    return [
        MembershipOut(organization=OrganizationOut.model_validate(org), role=role)
        for org, role in await school.memberships(ctx.user.id)
    ]


@router.get("/organizations/{org_id}", response_model=MembershipOut)
async def get_organization(org_id: uuid.UUID, ctx: CurrentDep, school: SchoolDep) -> MembershipOut:
    org, member = await school.member_of(ctx.user.id, org_id)
    return MembershipOut(organization=OrganizationOut.model_validate(org), role=member.role)


@router.get("/organizations/{org_id}/classes", response_model=list[ClassOut])
async def list_classes(org_id: uuid.UUID, ctx: CurrentDep, school: SchoolDep) -> list[ClassOut]:
    _, member = await school.member_of(ctx.user.id, org_id)
    return await school.list_classes(org_id, member)


@router.post("/organizations/{org_id}/classes", response_model=ClassOut, status_code=201)
async def create_class(org_id: uuid.UUID, body: ClassIn, ctx: CurrentDep, school: SchoolDep) -> ClassOut:
    org, _ = await school.member_of(ctx.user.id, org_id, ADMIN)
    school.require_active(org)
    return await school.one_class_out(await school.create_class(org_id, body))


@router.get("/organizations/{org_id}/classes/{class_id}", response_model=ClassOut)
async def get_class(org_id: uuid.UUID, class_id: uuid.UUID, ctx: CurrentDep, school: SchoolDep) -> ClassOut:
    _, member = await school.member_of(ctx.user.id, org_id)
    return await school.one_class_out(await school.get_class(org_id, class_id, member))


@router.patch("/organizations/{org_id}/classes/{class_id}", response_model=ClassOut)
async def patch_class(
    org_id: uuid.UUID, class_id: uuid.UUID, body: ClassPatch, ctx: CurrentDep, school: SchoolDep
) -> ClassOut:
    org, member = await school.member_of(ctx.user.id, org_id, ADMIN)
    school.require_active(org)
    school_class = await school.get_class(org_id, class_id, member)
    return await school.one_class_out(await school.patch_class(school_class, body))


@router.get("/organizations/{org_id}/teachers", response_model=list[TeacherOut])
async def list_teachers(org_id: uuid.UUID, ctx: CurrentDep, school: SchoolDep) -> list[TeacherOut]:
    await school.member_of(ctx.user.id, org_id, ADMIN)
    return await school.teachers(org_id)


@router.post("/organizations/{org_id}/teachers/{teacher_id}/classes", response_model=list[TeacherOut])
async def set_teacher_classes(
    org_id: uuid.UUID, teacher_id: uuid.UUID, body: TeacherClassesIn, ctx: CurrentDep, school: SchoolDep
) -> list[TeacherOut]:
    org, _ = await school.member_of(ctx.user.id, org_id, ADMIN)
    school.require_active(org)
    await school.set_teacher_classes(org_id, teacher_id, body.class_ids)
    return await school.teachers(org_id)
