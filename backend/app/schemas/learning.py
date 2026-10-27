from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ProgressState = Literal["not_started", "in_progress", "completed"]


class SubjectOut(BaseModel):
    id: str
    code: str
    title_ru: str
    title_kz: str
    category: Literal["mandatory", "profile"]
    # Number of lessons that have a published version. Zero means the material is not ready yet.
    published_lessons: int


class LessonProgressOut(BaseModel):
    state: ProgressState
    last_step: int
    completed_at: datetime | None


class LessonSummaryOut(BaseModel):
    slug: str
    title_ru: str
    title_kz: str
    estimated_minutes: int
    progress: LessonProgressOut


class TopicOut(BaseModel):
    slug: str
    title_ru: str
    title_kz: str
    lessons: list[LessonSummaryOut]


class CurriculumOut(BaseModel):
    subject: SubjectOut
    topics: list[TopicOut]


class LessonStepOut(BaseModel):
    index: int
    heading_ru: str
    heading_kz: str
    body_ru: str
    body_kz: str
    key_fact_ru: str | None = None
    key_fact_kz: str | None = None
    example_ru: str | None = None
    example_kz: str | None = None


class LessonOut(BaseModel):
    slug: str
    subject_id: str
    topic_slug: str
    title_ru: str
    title_kz: str
    estimated_minutes: int
    source_reference: str
    version: int
    steps: list[LessonStepOut]
    progress: LessonProgressOut


class ProgressIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    last_step: int = Field(ge=0, le=199, description="Индекс шага, на котором остановился ученик (с нуля)")
    completed: bool = False


class ProgressOut(BaseModel):
    lesson_slug: str
    state: ProgressState
    last_step: int
    completed_at: datetime | None
