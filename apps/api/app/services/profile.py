import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.time import utcnow
from app.models import ProfilePair, StudentProfile
from app.schemas.profile import OnboardingCompleteRequest, ProfilePairOut, ProfileUpdateRequest, WorkspaceOut

PERSONAL_WORKSPACE = WorkspaceOut(id="personal", type="personal", title="Личное обучение", available=True)


def check_exam_consistency(exam_year: int, exam_period: str) -> None:
    """ЕНТ 2027 is only offered for 2027; the spring periods belong to 2026."""
    if exam_period == "ent_2027" and exam_year != 2027:
        raise AppError(422, "VALIDATION_ERROR", "Период «ЕНТ 2027» относится только к 2027 году")
    if exam_period in ("june_main", "march_paid") and exam_year != 2026:
        raise AppError(422, "VALIDATION_ERROR", "Выбранный период относится к 2026 году")


class ProfileService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get(self, user_id: uuid.UUID) -> StudentProfile | None:
        return await self.db.get(StudentProfile, user_id)

    async def complete_onboarding(self, user_id: uuid.UUID, data: OnboardingCompleteRequest) -> StudentProfile:
        check_exam_consistency(data.exam_year, data.exam_period)
        await self._require_active_pair(data.profile_pair_id)

        now = utcnow()
        profile = await self.get(user_id)
        if profile is None:
            profile = StudentProfile(user_id=user_id, created_at=now)
            self.db.add(profile)

        profile.interface_lang = data.interface_lang
        profile.exam_lang = data.exam_lang
        profile.profile_pair_id = data.profile_pair_id
        profile.target_score = data.target_score
        profile.exam_year = data.exam_year
        profile.exam_period = data.exam_period
        profile.daily_goal_minutes = data.daily_goal_minutes
        # The completion time is set once and kept if onboarding is submitted again.
        profile.onboarding_completed_at = profile.onboarding_completed_at or now
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def update(self, user_id: uuid.UUID, patch: ProfileUpdateRequest) -> StudentProfile:
        profile = await self.get(user_id)
        if profile is None or profile.onboarding_completed_at is None:
            raise AppError(409, "ONBOARDING_REQUIRED", "Сначала заполните профиль обучения")

        changes = patch.model_dump(exclude_unset=True)
        year = changes.get("exam_year", profile.exam_year)
        period = changes.get("exam_period", profile.exam_period)
        check_exam_consistency(year, period)
        if "profile_pair_id" in changes:
            await self._require_active_pair(changes["profile_pair_id"])

        for field, value in changes.items():
            setattr(profile, field, value)
        profile.updated_at = utcnow()
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def list_pairs(self) -> list[ProfilePairOut]:
        rows = (await self.db.execute(select(ProfilePair).where(ProfilePair.active.is_(True)).order_by(ProfilePair.code))).scalars()
        return [
            ProfilePairOut(
                id=pair.id,
                code=pair.code,
                title_ru=pair.title_ru,
                title_kz=pair.title_kz,
                cluster_ru=pair.cluster_ru,
                cluster_kz=pair.cluster_kz,
                subject_codes=[pair.subject_1_code, pair.subject_2_code],
            )
            for pair in rows
        ]

    async def workspaces(self, user_id: uuid.UUID) -> list[WorkspaceOut]:
        # Only the personal workspace exists until school memberships are implemented (stage 6).
        return [PERSONAL_WORKSPACE]

    async def _require_active_pair(self, pair_id: str) -> None:
        pair = await self.db.get(ProfilePair, pair_id)
        if pair is None or not pair.active:
            raise AppError(422, "VALIDATION_ERROR", "Выбранная пара предметов недоступна")
