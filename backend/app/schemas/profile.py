from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

InterfaceLang = Literal["ru", "kz"]
ExamPeriod = Literal["june_main", "march_paid", "ent_2027"]


class OnboardingCompleteRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    interface_lang: InterfaceLang
    exam_lang: InterfaceLang
    profile_pair_id: str = Field(min_length=1, max_length=32)
    target_score: int = Field(ge=60, le=140, description="Желаемый балл; не является достигнутым результатом")
    exam_year: int = Field(ge=2026, le=2030)
    exam_period: ExamPeriod
    daily_goal_minutes: int = Field(ge=10, le=240)


class ProfileUpdateRequest(BaseModel):
    """Partial update. Fields not sent stay unchanged. Completed attempts are never touched."""

    model_config = ConfigDict(extra="forbid")

    interface_lang: InterfaceLang | None = None
    exam_lang: InterfaceLang | None = None
    profile_pair_id: str | None = Field(default=None, min_length=1, max_length=32)
    target_score: int | None = Field(default=None, ge=60, le=140)
    exam_year: int | None = Field(default=None, ge=2026, le=2030)
    exam_period: ExamPeriod | None = None
    daily_goal_minutes: int | None = Field(default=None, ge=10, le=240)

    @model_validator(mode="after")
    def reject_explicit_null(self) -> "ProfileUpdateRequest":
        # A field that is sent must carry a value; omit it to keep the current one.
        for name in self.model_fields_set:
            if getattr(self, name) is None:
                raise ValueError(f"{name} cannot be null")
        return self


class ProfileOut(BaseModel):
    interface_lang: InterfaceLang
    exam_lang: InterfaceLang
    profile_pair_id: str
    target_score: int
    exam_year: int
    exam_period: ExamPeriod
    daily_goal_minutes: int
    onboarding_completed_at: datetime | None


class ProfilePairOut(BaseModel):
    id: str
    code: str
    title_ru: str
    title_kz: str
    cluster_ru: str
    cluster_kz: str
    subject_codes: list[str]


class WorkspaceOut(BaseModel):
    id: str
    type: Literal["personal", "school", "teacher", "platform_admin"]
    title: str
    available: bool
