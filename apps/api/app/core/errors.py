import logging
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("qazmind.errors")


class AppError(Exception):
    """Expected business error. Rendered as the common error envelope with the given HTTP status."""

    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def error_body(request: Request, code: str, message: str, details: list[dict[str, Any]] | None = None) -> dict:
    error: dict[str, Any] = {
        "code": code,
        "message": message,
        "request_id": getattr(request.state, "request_id", None),
    }
    if details:
        error["details"] = details
    return {"error": error}


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=error_body(request, exc.code, exc.message))

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        # Only location and message are returned: the input value is never echoed back.
        details = [
            {"field": ".".join(str(part) for part in err.get("loc", ())[1:]), "message": err.get("msg", "")}
            for err in exc.errors()
        ]
        return JSONResponse(
            status_code=422,
            content=error_body(request, "VALIDATION_ERROR", "Проверьте введённые данные", details),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_error(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        codes = {404: "NOT_FOUND", 405: "METHOD_NOT_ALLOWED"}
        code = codes.get(exc.status_code, "HTTP_ERROR")
        message = "Ресурс не найден" if exc.status_code == 404 else str(exc.detail)
        return JSONResponse(status_code=exc.status_code, content=error_body(request, code, message))

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error rid=%s", getattr(request.state, "request_id", None))
        return JSONResponse(
            status_code=500,
            content=error_body(request, "INTERNAL_ERROR", "Внутренняя ошибка сервера"),
        )
