from fastapi import APIRouter

from app.api.deps import CurrentDep, ProfileDep
from app.core.errors import AppError
from app.models import StudentProfile
from app.schemas.profile import OnboardingCompleteRequest, ProfileOut, ProfileUpdateRequest, WorkspaceOut

router = APIRouter(prefix="/me", tags=["profile"])


def _profile_out(profile: StudentProfile) -> ProfileOut:
    return ProfileOut(
        interface_lang=profile.interface_lang,
        exam_lang=profile.exam_lang,
        profile_pair_id=profile.profile_pair_id,
        target_score=profile.target_score,
        exam_year=profile.exam_year,
        exam_period=profile.exam_period,
        daily_goal_minutes=profile.daily_goal_minutes,
        onboarding_completed_at=profile.onboarding_completed_at,
    )


@router.get("/profile", response_model=ProfileOut)
async def get_profile(ctx: CurrentDep, profiles: ProfileDep) -> ProfileOut:
    profile = await profiles.get(ctx.user.id)
    if profile is None or profile.onboarding_completed_at is None:
        raise AppError(404, "PROFILE_NOT_FOUND", "Профиль обучения ещё не заполнен")
    return _profile_out(profile)


@router.patch("/profile", response_model=ProfileOut)
async def update_profile(body: ProfileUpdateRequest, ctx: CurrentDep, profiles: ProfileDep) -> ProfileOut:
    return _profile_out(await profiles.update(ctx.user.id, body))


@router.post("/onboarding/complete", response_model=ProfileOut)
async def complete_onboarding(body: OnboardingCompleteRequest, ctx: CurrentDep, profiles: ProfileDep) -> ProfileOut:
    return _profile_out(await profiles.complete_onboarding(ctx.user.id, body))


@router.get("/workspaces", response_model=list[WorkspaceOut])
async def workspaces(ctx: CurrentDep, profiles: ProfileDep) -> list[WorkspaceOut]:
    return await profiles.workspaces(ctx.user.id)
