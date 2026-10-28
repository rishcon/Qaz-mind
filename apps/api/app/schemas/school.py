import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

OrgType = Literal["school", "lyceum", "gymnasium", "college", "tutoring_center", "other"]
YEAR_RE = re.compile(r"^(20\d\d)-(20\d\d)$")


def _clean(value: str) -> str:
    return " ".join(value.split())


class ApplicationIn(BaseModel):
    school_name: str = Field(min_length=3, max_length=200)
    type: OrgType
    city: str = Field(min_length=2, max_length=120)
    contact_name: str = Field(min_length=2, max_length=120)
    contact_position: str = Field(default="", max_length=120)
    contact_phone: str = Field(min_length=6, max_length=40)
    approx_students: int = Field(ge=1, le=100000)

    @field_validator("school_name", "city", "contact_name", "contact_position", "contact_phone")
    @classmethod
    def _tidy(cls, value: str) -> str:
        return _clean(value)


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    school_name: str
    type: str
    city: str
    contact_name: str
    contact_position: str
    contact_phone: str
    approx_students: int
    status: str
    rejection_reason: str
    organization_id: uuid.UUID | None
    created_at: datetime


class OrganizationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    type: str
    city: str
    status: str


class MembershipOut(BaseModel):
    organization: OrganizationOut
    role: str


class ClassIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    academic_year: str
    grade: int | None = Field(default=None, ge=1, le=12)

    @field_validator("name")
    @classmethod
    def _name(cls, value: str) -> str:
        value = _clean(value)
        if not value:
            raise ValueError("Название класса не может быть пустым")
        return value

    @field_validator("academic_year")
    @classmethod
    def _year(cls, value: str) -> str:
        match = YEAR_RE.match(value)
        if not match or int(match.group(2)) != int(match.group(1)) + 1:
            raise ValueError("Учебный год в формате 2026-2027")
        return value


class ClassPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    status: Literal["active", "archived"] | None = None

    @field_validator("name")
    @classmethod
    def _name(cls, value: str | None) -> str | None:
        return _clean(value) if value else value


class ClassOut(BaseModel):
    id: uuid.UUID
    name: str
    academic_year: str
    grade: int | None
    status: str
    student_count: int
    teacher_count: int


class TeacherOut(BaseModel):
    user_id: uuid.UUID
    name: str
    email: str
    status: str
    class_ids: list[uuid.UUID]


class TeacherClassesIn(BaseModel):
    class_ids: list[uuid.UUID] = Field(max_length=200)


class RejectIn(BaseModel):
    reason: str = Field(min_length=5, max_length=1000)
