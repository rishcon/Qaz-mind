import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.practice import PracticeQuestionOut


def _clean(value: str) -> str:
    return " ".join(value.split())


class AssignmentIn(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    subject_id: str = Field(min_length=1, max_length=32)
    question_count: int = Field(ge=1, le=40)
    class_ids: list[uuid.UUID] = Field(min_length=1, max_length=50)
    due_at: datetime | None = None
    max_attempts: int = Field(default=1, ge=1, le=10)
    score_policy: Literal["best", "last"] = "best"
    reveal: Literal["after_submit", "after_close"] = "after_close"

    @field_validator("title")
    @classmethod
    def _title(cls, value: str) -> str:
        return _clean(value)


class AssignmentOut(BaseModel):
    id: uuid.UUID
    title: str
    subject_id: str
    question_count: int
    class_ids: list[uuid.UUID]
    due_at: datetime | None
    max_attempts: int
    score_policy: str
    reveal: str
    status: str
    created_by: str
    created_at: datetime
    published_at: datetime | None
    closed_at: datetime | None
    submitted_count: int = 0


class ResultRow(BaseModel):
    student_id: uuid.UUID
    name: str
    email: str
    class_id: uuid.UUID
    class_name: str
    state: Literal["not_started", "in_progress", "submitted"]
    attempts: int
    best_score: int | None
    last_score: int | None
    final_score: int | None
    max_score: int | None
    last_submitted_at: datetime | None


class ResultsOut(BaseModel):
    assignment: AssignmentOut
    score_policy: str
    rows: list[ResultRow]
    submitted: int
    total_students: int
    average_final: float | None


class MyAttemptSummary(BaseModel):
    id: uuid.UUID
    number: int
    submitted: bool
    score: int | None
    max_score: int | None


class MyAssignmentOut(BaseModel):
    id: uuid.UUID
    title: str
    subject_id: str
    organization_name: str
    class_name: str
    question_count: int
    due_at: datetime | None
    max_attempts: int
    score_policy: str
    status: str
    attempts: list[MyAttemptSummary]
    can_start: bool
    in_progress_attempt_id: uuid.UUID | None
    # Visible only when the teacher's reveal setting allows it for this assignment.
    final_score: int | None
    max_score: int | None
    result_visible: bool


class AttemptReview(BaseModel):
    selected_label: str | None
    correct_label: str
    is_correct: bool
    explanation_ru: str
    explanation_kz: str


class AttemptQuestion(BaseModel):
    question: PracticeQuestionOut
    selected_label: str | None
    review: AttemptReview | None


class AttemptOut(BaseModel):
    id: uuid.UUID
    assignment_id: uuid.UUID
    title: str
    number: int
    started_at: datetime
    submitted_at: datetime | None
    due_at: datetime | None
    total: int
    answered: int
    score: int | None
    max_score: int | None
    result_visible: bool
    items: list[AttemptQuestion]


class AttemptAnswerIn(BaseModel):
    question_id: uuid.UUID
    selected_label: Literal["A", "B", "C", "D", "E"]
