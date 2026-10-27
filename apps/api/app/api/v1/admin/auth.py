from fastapi import APIRouter, Request, Response
from pydantic import BaseModel, EmailStr, Field

from app.admin.service import StaffContext, staff_out
from app.api.deps import SettingsDep
from app.api.v1.admin.deps import (
    MetaDep,
    PendingDep,
    ServiceDep,
    StaffDep,
    clear_staff_cookie,
    set_staff_cookie,
)

router = APIRouter(prefix="/auth", tags=["admin-auth"])


class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=256)


class CodeIn(BaseModel):
    code: str = Field(min_length=6, max_length=8)


class AcceptIn(BaseModel):
    token: str = Field(min_length=10, max_length=200)
    name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=256)


def _me(ctx: StaffContext) -> dict:
    return {
        "staff": staff_out(ctx.staff, ctx.roles),
        "permissions": sorted(ctx.permissions),
        "mfa_verified": ctx.mfa_verified,
        "mfa_enrolled": ctx.staff.totp_enabled,
    }


@router.post("/login")
async def login(body: LoginIn, response: Response, service: ServiceDep, settings: SettingsDep, meta: MetaDep) -> dict:
    staff, raw = await service.login(body.email, body.password, meta)
    set_staff_cookie(response, settings, raw)
    # The session is not usable yet: the next step is the code from the authenticator app.
    return {"next": "mfa_verify" if staff.totp_enabled else "mfa_setup"}


@router.get("/mfa/setup")
async def mfa_setup(ctx: PendingDep, service: ServiceDep) -> dict:
    secret, uri = await service.mfa_setup(ctx)
    return {"secret": secret, "otpauth_uri": uri}


@router.post("/mfa")
async def mfa_verify(body: CodeIn, ctx: PendingDep, service: ServiceDep, meta: MetaDep) -> dict:
    await service.mfa_verify(ctx, body.code, meta)
    return _me(ctx)


@router.post("/logout", status_code=204)
async def logout(request: Request, service: ServiceDep, settings: SettingsDep) -> Response:
    raw = request.cookies.get(settings.staff_session_cookie_name)
    if raw:
        await service.logout(raw)
    response = Response(status_code=204)
    clear_staff_cookie(response, settings)
    return response


@router.get("/me")
async def me(ctx: StaffDep) -> dict:
    return _me(ctx)


@router.get("/session")
async def session_state(ctx: PendingDep) -> dict:
    """State of the current session, including one that still waits for the second factor."""
    return _me(ctx)


@router.get("/invitations/{token}")
async def invitation(token: str, service: ServiceDep) -> dict:
    staff, roles = await service.invitation_info(token)
    return {"email": staff.email, "name": staff.name, "roles": list(roles)}


@router.post("/invitations/accept")
async def accept(body: AcceptIn, service: ServiceDep, meta: MetaDep, settings: SettingsDep) -> dict:
    await service.accept_invitation(body.token, body.name, body.password, meta)
    return {"status": "accepted", "password_min_length": settings.staff_password_min_length}
