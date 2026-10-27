"""Format of a content file. Import rejects anything that does not match: no partial or guessed data."""

from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, model_validator

SLUG_RE = r"^[a-z0-9][a-z0-9-]*[a-z0-9]$"


def _text(min_length: int, max_length: int):
    return Annotated[str, StringConstraints(strip_whitespace=True, min_length=min_length, max_length=max_length)]


class StepIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    heading_ru: _text(1, 120)
    heading_kz: _text(1, 120)
    body_ru: _text(1, 4000)
    body_kz: _text(1, 4000)
    key_fact_ru: _text(1, 600) | None = None
    key_fact_kz: _text(1, 600) | None = None
    example_ru: _text(1, 1200) | None = None
    example_kz: _text(1, 1200) | None = None


class LessonIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: Annotated[str, StringConstraints(pattern=SLUG_RE, min_length=3, max_length=120)]
    position: int = Field(ge=1, le=200)
    title_ru: _text(1, 200)
    title_kz: _text(1, 200)
    estimated_minutes: int = Field(ge=1, le=180)
    source_reference: _text(3, 300)
    steps: list[StepIn] = Field(min_length=1, max_length=40)


class TopicIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: Annotated[str, StringConstraints(pattern=SLUG_RE, min_length=3, max_length=80)]
    position: int = Field(ge=1, le=100)
    title_ru: _text(1, 200)
    title_kz: _text(1, 200)
    lessons: list[LessonIn] = Field(min_length=1)


class ContentFile(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: Annotated[str, StringConstraints(pattern=r"^[a-z_]{3,32}$")]
    author: _text(2, 120)
    topics: list[TopicIn] = Field(min_length=1)

    @model_validator(mode="after")
    def slugs_are_unique(self) -> "ContentFile":
        topic_slugs = [topic.slug for topic in self.topics]
        lesson_slugs = [lesson.slug for topic in self.topics for lesson in topic.lessons]
        if len(set(topic_slugs)) != len(topic_slugs):
            raise ValueError("topic slugs must be unique within the file")
        if len(set(lesson_slugs)) != len(lesson_slugs):
            raise ValueError("lesson slugs must be unique within the file")
        return self
