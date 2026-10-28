import re
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class InvitationIn(BaseModel):
    email: str = Field(max_length=254)
    role: Literal["SCHOOL_ADMIN", "TEACHER", "STUDENT"]
    class_id: uuid.UUID | None = None

    @field_validator("email")
    @classmethod
    def _email(cls, value: str) -> str:
        value = value.strip().lower()
        if not EMAIL_RE.match(value):
            raise ValueError("Некорректный email")
        return value


class InvitationOut(BaseModel):
    id: uuid.UUID
    email: str
    role: str
    class_id: uuid.UUID | None
    status: str
    expires_at: datetime
    created_at: datetime


class AcceptIn(BaseModel):
    token: str = Field(min_length=20, max_length=200)


class AcceptOut(BaseModel):
    organization_id: uuid.UUID
    role: str
    class_id: uuid.UUID | None


class JoinCodeIn(BaseModel):
    valid_days: int = Field(default=14, ge=1, le=60)
    max_uses: int = Field(default=50, ge=1, le=1000)


class JoinCodeOut(BaseModel):
    id: uuid.UUID
    code_hint: str
    expires_at: datetime
    max_uses: int
    uses_count: int
    revoked: bool
    # The full code is returned only by the creating call.
    code: str | None = None


class JoinRequestIn(BaseModel):
    code: str = Field(min_length=4, max_length=40)


class JoinRequestOut(BaseModel):
    id: uuid.UUID
    status: str
    class_id: uuid.UUID
    class_name: str
    organization_name: str
    created_at: datetime


class ClassJoinRequestOut(BaseModel):
    id: uuid.UUID
    status: str
    user_id: uuid.UUID
    name: str
    email: str
    created_at: datetime


class ClassStudentOut(BaseModel):
    user_id: uuid.UUID
    name: str
    email: str
    joined_at: datetime


class MyClassOut(BaseModel):
    class_id: uuid.UUID
    class_name: str
    academic_year: str
    organization_id: uuid.UUID
    organization_name: str


class LicenseIn(BaseModel):
    plan: str = Field(min_length=2, max_length=40)
    seat_limit: int = Field(ge=1, le=100000)
    starts_at: datetime
    expires_at: datetime


class LicenseOut(BaseModel):
    id: uuid.UUID
    plan: str
    seat_limit: int
    seats_used: int
    starts_at: datetime
    expires_at: datetime
    status: str
    current: bool
