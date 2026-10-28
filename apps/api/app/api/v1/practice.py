import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentDep, get_db
from app.schemas.practice import AnswerIn, PracticeSubjectOut, ReviewOut, SessionCreate, SessionOut, StatsOut
from app.services.practice import PracticeService

router = APIRouter(prefix="/practice", tags=["practice"])


def get_practice_service(db: Annotated[AsyncSession, Depends(get_db)]) -> PracticeService:
    return PracticeService(db)


PracticeDep = Annotated[PracticeService, Depends(get_practice_service)]


@router.get("/subjects", response_model=list[PracticeSubjectOut])
async def practice_subjects(ctx: CurrentDep, practice: PracticeDep) -> list[PracticeSubjectOut]:
    return await practice.subjects()


@router.get("/stats", response_model=StatsOut)
async def practice_stats(ctx: CurrentDep, practice: PracticeDep) -> StatsOut:
    return await practice.stats(ctx.user.id)


@router.post("/sessions", response_model=SessionOut, status_code=201)
async def start_session(body: SessionCreate, ctx: CurrentDep, practice: PracticeDep) -> SessionOut:
    return await practice.start(ctx.user.id, body.subject_id, body.count)


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(session_id: uuid.UUID, ctx: CurrentDep, practice: PracticeDep) -> SessionOut:
    return await practice.get(ctx.user.id, session_id)


@router.post("/sessions/{session_id}/answers", response_model=ReviewOut)
async def answer(session_id: uuid.UUID, body: AnswerIn, ctx: CurrentDep, practice: PracticeDep) -> ReviewOut:
    return await practice.answer(ctx.user.id, session_id, body.question_id, body.selected_label)


@router.post("/sessions/{session_id}/finish", response_model=SessionOut)
async def finish_session(session_id: uuid.UUID, ctx: CurrentDep, practice: PracticeDep) -> SessionOut:
    return await practice.finish(ctx.user.id, session_id)
