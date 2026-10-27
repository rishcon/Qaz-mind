from typing import Annotated

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.errors import error_body

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/live")
async def live() -> dict[str, str]:
    """The process is up. Does not touch the database."""
    return {"status": "ok"}


@router.get("/ready")
async def ready(request: Request, db: Annotated[AsyncSession, Depends(get_db)]) -> JSONResponse:
    """Ready to serve traffic: the database answers a trivial query."""
    try:
        await db.execute(text("SELECT 1"))
    except Exception:
        return JSONResponse(
            status_code=503,
            content=error_body(request, "DB_UNAVAILABLE", "База данных недоступна"),
        )
    return JSONResponse(status_code=200, content={"status": "ready", "database": "ok"})
