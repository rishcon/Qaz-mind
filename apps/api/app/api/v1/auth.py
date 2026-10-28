from fastapi import APIRouter, Request, Response

from app.api.cookies import clear_session_cookie, set_csrf_cookie, set_session_cookie
from app.api.deps import AuthDep, CurrentDep, ProfileDep, SettingsDep
from app.core.security import generate_token
from app.schemas.auth import (
    ChangePasswordRequest,
    CsrfResponse,
    EmailRequest,
    LoginRequest,
    MeResponse,
    PasswordResetRequest,
    RegisterRequest,
    StatusResponse,
    UserOut,
    VerifyEmailRequest,
)
from app.models import OrganizationApplication
from app.schemas.school import SchoolRegisterRequest
from app.services.auth import SessionContext
from app.services.profile import ProfileService

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_out(ctx_user) -> UserOut:
    return UserOut(
        id=ctx_user.id,
        name=ctx_user.name,
        email=ctx_user.email,
        email_verified=ctx_user.email_verified_at is not None,
        created_at=ctx_user.created_at,
        username=ctx_user.username,
        account_type=ctx_user.account_type,
        must_change_password=ctx_user.must_change_password,
    )


async def _me(ctx: SessionContext, profiles: ProfileService) -> MeResponse:
    profile = await profiles.get(ctx.user.id)
    completed = profile is not None and profile.onboarding_completed_at is not None
    return MeResponse(user=_user_out(ctx.user), onboarding_completed=completed)


@router.get("/csrf", response_model=CsrfResponse)
async def csrf(request: Request, response: Response, settings: SettingsDep) -> CsrfResponse:
    """Issues the CSRF cookie. Call once before the first POST/PUT/PATCH/DELETE."""
    token = request.cookies.get(settings.csrf_cookie_name) or generate_token()
    set_csrf_cookie(response, settings, token)
    return CsrfResponse(csrf_token=token)


@router.post("/register", status_code=202, response_model=StatusResponse)
async def register(body: RegisterRequest, auth: AuthDep) -> StatusResponse:
    await auth.register(body.name, body.email, body.password)
    # Same answer for new and existing addresses, so the endpoint cannot be used to enumerate accounts.
    return StatusResponse(status="check_email")


@router.post("/register-school", status_code=202, response_model=StatusResponse)
async def register_school(body: SchoolRegisterRequest, auth: AuthDep) -> StatusResponse:
    """A school representative signs up as a school, not as a student. The application waits for platform review."""
    data = body.model_dump(exclude={"name", "email", "password"})

    def add_application(user) -> None:
        auth.db.add(OrganizationApplication(applicant_user_id=user.id, **data))

    await auth.register(body.name, body.email, body.password, account_type="school", on_created=add_application)
    return StatusResponse(status="check_email")


@router.post("/resend-verification", status_code=202, response_model=StatusResponse)
async def resend_verification(body: EmailRequest, auth: AuthDep) -> StatusResponse:
    await auth.resend_verification(body.email)
    return StatusResponse(status="check_email")


@router.post("/verify-email", response_model=MeResponse)
async def verify_email(
    body: VerifyEmailRequest,
    response: Response,
    auth: AuthDep,
    profiles: ProfileDep,
    settings: SettingsDep,
) -> MeResponse:
    ctx, raw_session = await auth.verify_email(body.token)
    set_session_cookie(response, settings, raw_session)
    return await _me(ctx, profiles)


@router.post("/login", response_model=MeResponse)
async def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    auth: AuthDep,
    profiles: ProfileDep,
    settings: SettingsDep,
) -> MeResponse:
    current = request.cookies.get(settings.session_cookie_name)
    session, user, raw_session = await auth.login(body.email, body.password, current)
    set_session_cookie(response, settings, raw_session)
    return await _me(SessionContext(session=session, user=user), profiles)


@router.post("/logout", status_code=204)
async def logout(request: Request, auth: AuthDep, settings: SettingsDep) -> Response:
    raw_session = request.cookies.get(settings.session_cookie_name)
    if raw_session:
        await auth.logout(raw_session)
    response = Response(status_code=204)
    clear_session_cookie(response, settings)
    return response


@router.get("/me", response_model=MeResponse)
async def me(ctx: CurrentDep, profiles: ProfileDep) -> MeResponse:
    return await _me(ctx, profiles)


@router.post("/password/change", status_code=204)
async def password_change(body: ChangePasswordRequest, ctx: CurrentDep, auth: AuthDep) -> None:
    await auth.change_password(ctx.user, body.current_password, body.new_password, ctx.session.id)


@router.post("/password/forgot", status_code=202, response_model=StatusResponse)
async def password_forgot(body: EmailRequest, auth: AuthDep) -> StatusResponse:
    await auth.request_password_reset(body.email)
    return StatusResponse(status="check_email")


@router.post("/password/reset", response_model=StatusResponse)
async def password_reset(body: PasswordResetRequest, auth: AuthDep) -> StatusResponse:
    await auth.reset_password(body.token, body.password)
    return StatusResponse(status="password_updated")
