from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.services.auth import AuthService, SessionContext
from app.services.mail import Mailer
from app.services.profile import ProfileService


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_mailer(request: Request) -> Mailer:
    return request.app.state.mailer


async def get_db(request: Request) -> AsyncIterator[AsyncSession]:
    factory = request.app.state.session_factory
    async with factory() as session:
        yield session


def get_auth_service(
    db: Annotated[AsyncSession, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_settings)],
    mailer: Annotated[Mailer, Depends(get_mailer)],
) -> AuthService:
    return AuthService(db, settings, mailer)


def get_profile_service(db: Annotated[AsyncSession, Depends(get_db)]) -> ProfileService:
    return ProfileService(db)


async def get_current_context(
    request: Request,
    auth: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> SessionContext:
    raw_session = request.cookies.get(settings.session_cookie_name)
    if not raw_session:
        raise AppError(401, "NOT_AUTHENTICATED", "Требуется вход в аккаунт")
    return await auth.resolve_session(raw_session)


SettingsDep = Annotated[Settings, Depends(get_settings)]
AuthDep = Annotated[AuthService, Depends(get_auth_service)]
ProfileDep = Annotated[ProfileService, Depends(get_profile_service)]
CurrentDep = Annotated[SessionContext, Depends(get_current_context)]
