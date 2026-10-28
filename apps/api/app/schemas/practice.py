import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Label = Literal["A", "B", "C", "D", "E"]


class PracticeSubjectOut(BaseModel):
    subject_id: str
    # Published questions the student can practise on. Subjects without any are not listed.
    available: int


class SessionCreate(BaseModel):
    subject_id: str = Field(min_length=3, max_length=32)
    count: int = Field(default=10, ge=1, le=20)


class OptionOut(BaseModel):
    label: Label
    text_ru: str
    text_kz: str


class PracticeQuestionOut(BaseModel):
    """What the student sees while answering. The key and the explanation are not part of it."""

    id: uuid.UUID
    difficulty: Literal["easy", "medium", "hard"]
    text_ru: str
    text_kz: str
    options: list[OptionOut]


class ReviewOut(BaseModel):
    """Shown only for a question the student has already answered."""

    selected_label: Label
    correct_label: Label
    is_correct: bool
    explanation_ru: str
    explanation_kz: str


class SessionQuestionOut(BaseModel):
    question: PracticeQuestionOut
    review: ReviewOut | None


class SessionOut(BaseModel):
    id: uuid.UUID
    subject_id: str
    created_at: datetime
    finished_at: datetime | None
    total: int
    answered: int
    correct: int
    items: list[SessionQuestionOut]


class AnswerIn(BaseModel):
    question_id: uuid.UUID
    selected_label: Label


class StatsOut(BaseModel):
    answered: int
    correct: int


class MistakeOut(BaseModel):
    """A question the student answered wrongly. The key is shown because the student has already seen it."""

    question_id: uuid.UUID
    subject_id: str
    difficulty: Literal["easy", "medium", "hard"]
    text_ru: str
    text_kz: str
    options: list[OptionOut]
    correct_label: Label
    explanation_ru: str
    explanation_kz: str
    # The label chosen the last time the answer was wrong.
    wrong_label: Label
    wrong_count: int
    last_wrong_at: datetime
    # True when the latest answer to this question is correct.
    resolved: bool


class RetryIn(BaseModel):
    selected_label: Label
