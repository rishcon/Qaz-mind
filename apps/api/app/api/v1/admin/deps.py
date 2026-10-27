from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, Request, Response

from app.admin.service import RequestMeta, StaffContext, StaffService
from app.api.deps import get_db, get_mailer, get_settings
from app.core.config import Settings
from app.core.errors import AppError


def get_staff_service(
    db=Depends(get_db),
    settings: Settings = Depends(get_settings),
    mailer=Depends(get_mailer),
) -> StaffService:
    return StaffService(db, settings, mailer)


def request_meta(request: Request) -> RequestMeta:
    client = request.client.host if request.client else None
    return RequestMeta(request_id=getattr(request.state, "request_id", None), ip=client)


def _raw_session(request: Request, settings: Settings) -> str:
    raw = request.cookies.get(settings.staff_session_cookie_name)
    if not raw:
        raise AppError(401, "NOT_AUTHENTICATED", "Требуется вход сотрудника")
    return raw


async def pending_staff(
    request: Request,
    service: Annotated[StaffService, Depends(get_staff_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> StaffContext:
    """A staff session that passed the password step; the second factor may still be missing."""
    return await service.resolve(_raw_session(request, settings), require_mfa=False)


async def current_staff(
    request: Request,
    service: Annotated[StaffService, Depends(get_staff_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> StaffContext:
    """A fully signed-in staff session: password and TOTP confirmed."""
    return await service.resolve(_raw_session(request, settings), require_mfa=True)


def require(permission: str) -> Callable[..., StaffContext]:
    async def dependency(ctx: Annotated[StaffContext, Depends(current_staff)]) -> StaffContext:
        ctx.require(permission)
        return ctx

    return dependency


def set_staff_cookie(response: Response, settings: Settings, raw: str) -> None:
    response.set_cookie(
        key=settings.staff_session_cookie_name,
        value=raw,
        max_age=settings.staff_session_hours * 3600,
        path="/api/v1/admin",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
    )


def clear_staff_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.staff_session_cookie_name,
        path="/api/v1/admin",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="strict",
    )


ServiceDep = Annotated[StaffService, Depends(get_staff_service)]
MetaDep = Annotated[RequestMeta, Depends(request_meta)]
StaffDep = Annotated[StaffContext, Depends(current_staff)]
PendingDep = Annotated[StaffContext, Depends(pending_staff)]
