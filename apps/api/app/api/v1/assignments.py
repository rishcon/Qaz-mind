"""School assignments: the teacher's side (per organization) and the student's side (own attempts)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentDep, get_db
from app.schemas.assignment import (
    AssignmentIn,
    AssignmentOut,
    AttemptAnswerIn,
    AttemptOut,
    MyAssignmentOut,
    ResultsOut,
)
from app.services.assignment import AssignmentService
from app.services.school import SchoolService

router = APIRouter(tags=["assignments"])


def get_assignment_service(db: Annotated[AsyncSession, Depends(get_db)]) -> AssignmentService:
    return AssignmentService(db)


AssignmentDep = Annotated[AssignmentService, Depends(get_assignment_service)]


async def _member(service: AssignmentService, ctx, org_id: uuid.UUID, write: bool = False):
    school = SchoolService(service.db)
    organization, member = await school.member_of(ctx.user.id, org_id)
    if write:
        school.require_active(organization)
    return member


@router.get("/organizations/{org_id}/assignments", response_model=list[AssignmentOut])
async def list_assignments(org_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> list[AssignmentOut]:
    return await service.list_for(org_id, await _member(service, ctx, org_id))


@router.post("/organizations/{org_id}/assignments", response_model=AssignmentOut, status_code=201)
async def create_assignment(org_id: uuid.UUID, body: AssignmentIn, ctx: CurrentDep, service: AssignmentDep) -> AssignmentOut:
    return await service.create(org_id, await _member(service, ctx, org_id, True), body)


@router.get("/organizations/{org_id}/assignments/{assignment_id}", response_model=AssignmentOut)
async def get_assignment(org_id: uuid.UUID, assignment_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> AssignmentOut:
    return await service.get(org_id, assignment_id, await _member(service, ctx, org_id))


@router.put("/organizations/{org_id}/assignments/{assignment_id}", response_model=AssignmentOut)
async def update_assignment(
    org_id: uuid.UUID, assignment_id: uuid.UUID, body: AssignmentIn, ctx: CurrentDep, service: AssignmentDep
) -> AssignmentOut:
    return await service.update(org_id, assignment_id, await _member(service, ctx, org_id, True), body)


@router.post("/organizations/{org_id}/assignments/{assignment_id}/publish", response_model=AssignmentOut)
async def publish_assignment(org_id: uuid.UUID, assignment_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> AssignmentOut:
    return await service.publish(org_id, assignment_id, await _member(service, ctx, org_id, True))


@router.post("/organizations/{org_id}/assignments/{assignment_id}/close", response_model=AssignmentOut)
async def close_assignment(org_id: uuid.UUID, assignment_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> AssignmentOut:
    return await service.close(org_id, assignment_id, await _member(service, ctx, org_id))


@router.post("/organizations/{org_id}/assignments/{assignment_id}/archive", response_model=AssignmentOut)
async def archive_assignment(org_id: uuid.UUID, assignment_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> AssignmentOut:
    return await service.archive(org_id, assignment_id, await _member(service, ctx, org_id))


@router.get("/organizations/{org_id}/assignments/{assignment_id}/results", response_model=ResultsOut)
async def assignment_results(org_id: uuid.UUID, assignment_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> ResultsOut:
    return await service.results(org_id, assignment_id, await _member(service, ctx, org_id))


# ----- the student's side -----------------------------------------------------------------------------------


@router.get("/me/school-assignments", response_model=list[MyAssignmentOut])
async def my_assignments(ctx: CurrentDep, service: AssignmentDep) -> list[MyAssignmentOut]:
    return await service.my_assignments(ctx.user.id)


@router.post("/school-assignments/{assignment_id}/attempts", response_model=AttemptOut, status_code=201)
async def start_attempt(assignment_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> AttemptOut:
    return await service.start(ctx.user.id, assignment_id)


@router.get("/school-assignments/attempts/{attempt_id}", response_model=AttemptOut)
async def get_attempt(attempt_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> AttemptOut:
    return await service.get_attempt(ctx.user.id, attempt_id)


@router.post("/school-assignments/attempts/{attempt_id}/answers", status_code=204)
async def answer_attempt(attempt_id: uuid.UUID, body: AttemptAnswerIn, ctx: CurrentDep, service: AssignmentDep) -> None:
    await service.answer(ctx.user.id, attempt_id, body.question_id, body.selected_label)


@router.post("/school-assignments/attempts/{attempt_id}/finish", response_model=AttemptOut)
async def finish_attempt(attempt_id: uuid.UUID, ctx: CurrentDep, service: AssignmentDep) -> AttemptOut:
    return await service.finish(ctx.user.id, attempt_id)
