from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
Password = Annotated[str, Field(min_length=8, max_length=128)]
Token = Annotated[str, Field(min_length=20, max_length=200)]


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Name
    email: EmailStr
    password: Password


class EmailRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    # An e-mail address, or the login of an account created by a school.
    email: Annotated[str, Field(min_length=2, max_length=254)]
    password: Annotated[str, Field(min_length=1, max_length=128)]


class VerifyEmailRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: Token


class PasswordResetRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    token: Token
    password: Password


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: Annotated[str, Field(min_length=1, max_length=128)]
    new_password: Password


class UserOut(BaseModel):
    id: UUID
    name: str
    email: str
    email_verified: bool
    created_at: datetime
    username: str | None = None
    account_type: str = "student"
    must_change_password: bool = False


class MeResponse(BaseModel):
    user: UserOut
    onboarding_completed: bool


class CsrfResponse(BaseModel):
    csrf_token: str


class StatusResponse(BaseModel):
    status: str
