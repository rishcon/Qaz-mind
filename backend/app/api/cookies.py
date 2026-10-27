from fastapi import Response

from app.core.config import Settings


def set_session_cookie(response: Response, settings: Settings, raw_session: str) -> None:
    # HttpOnly: page scripts cannot read the session. SameSite=Lax blocks it from cross-site POSTs.
    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_session,
        max_age=settings.session_ttl_days * 24 * 3600,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


def set_csrf_cookie(response: Response, settings: Settings, token: str) -> None:
    # Readable by the page on purpose: the page echoes it in the X-CSRF-Token header.
    response.set_cookie(
        key=settings.csrf_cookie_name,
        value=token,
        max_age=settings.session_ttl_days * 24 * 3600,
        path="/",
        httponly=False,
        secure=settings.cookie_secure,
        samesite="lax",
    )
