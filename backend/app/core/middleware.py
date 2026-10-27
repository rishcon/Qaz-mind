import logging
import re
import secrets
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp

from app.core.errors import error_body

http_logger = logging.getLogger("qazmind.http")

UNSAFE_METHODS = frozenset({"POST", "PUT", "PATCH", "DELETE"})
CSRF_HEADER = "X-CSRF-Token"
REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9_.-]{8,64}$")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assigns a request ID (reusing a safe incoming X-Request-ID) and logs one line per request."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        incoming = request.headers.get("x-request-id", "")
        request_id = incoming if REQUEST_ID_PATTERN.match(incoming) else uuid.uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        response = await call_next(request)
        elapsed_ms = (time.perf_counter() - started) * 1000
        response.headers["X-Request-ID"] = request_id
        http_logger.info(
            "%s %s status=%s duration_ms=%.1f rid=%s",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
            request_id,
        )
        return response


class CsrfMiddleware(BaseHTTPMiddleware):
    """Double-submit cookie check for state-changing API calls.

    The browser sends the qm_csrf cookie automatically; the frontend must copy its value into the
    X-CSRF-Token header. A cross-site page cannot read the cookie, so it cannot forge the header.
    """

    def __init__(self, app: ASGIApp, cookie_name: str, protected_prefix: str) -> None:
        super().__init__(app)
        self.cookie_name = cookie_name
        self.protected_prefix = protected_prefix

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method in UNSAFE_METHODS and request.url.path.startswith(self.protected_prefix):
            cookie_value = request.cookies.get(self.cookie_name, "")
            header_value = request.headers.get(CSRF_HEADER, "")
            if not cookie_value or not header_value or not secrets.compare_digest(cookie_value, header_value):
                # request.state.request_id is set by the outer RequestContextMiddleware.
                return JSONResponse(
                    status_code=403,
                    content=error_body(request, "CSRF_INVALID", "Сессия формы устарела. Обновите страницу."),
                )
        return await call_next(request)
