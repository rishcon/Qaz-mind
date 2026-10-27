from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import CurrentDep, get_db
from app.schemas.learning import CurriculumOut, LessonOut, ProgressIn, ProgressOut, SubjectOut
from app.services.learning import LearningService

router = APIRouter(tags=["learning"])


def get_learning_service(db: Annotated[AsyncSession, Depends(get_db)]) -> LearningService:
    return LearningService(db)


LearningDep = Annotated[LearningService, Depends(get_learning_service)]


@router.get("/subjects", response_model=list[SubjectOut])
async def subjects(ctx: CurrentDep, learning: LearningDep) -> list[SubjectOut]:
    return await learning.list_subjects()


@router.get("/subjects/{subject_id}/curriculum", response_model=CurriculumOut)
async def curriculum(subject_id: str, ctx: CurrentDep, learning: LearningDep) -> CurriculumOut:
    return await learning.curriculum(subject_id, ctx.user.id)


@router.get("/lessons/{slug}", response_model=LessonOut)
async def lesson(slug: str, ctx: CurrentDep, learning: LearningDep) -> LessonOut:
    return await learning.get_lesson(slug, ctx.user.id)


@router.put("/me/lessons/{slug}/progress", response_model=ProgressOut)
async def save_lesson_progress(slug: str, body: ProgressIn, ctx: CurrentDep, learning: LearningDep) -> ProgressOut:
    return await learning.save_progress(ctx.user.id, slug, body.last_step, body.completed)


@router.get("/me/progress", response_model=list[ProgressOut])
async def my_progress(ctx: CurrentDep, learning: LearningDep) -> list[ProgressOut]:
    return await learning.my_progress(ctx.user.id)
