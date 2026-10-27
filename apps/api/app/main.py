import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.errors import register_error_handlers
from app.core.middleware import CsrfMiddleware, RequestContextMiddleware
from app.db.session import create_engine_and_sessionmaker
from app.services.mail import Mailer, build_mailer


def create_app(settings: Settings | None = None, mailer: Mailer | None = None) -> FastAPI:
    settings = settings or get_settings()
    settings.validate_for_environment()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")

    engine, session_factory = create_engine_and_sessionmaker(settings.database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncIterator[None]:
        yield
        await engine.dispose()

    production_like = settings.is_production_like
    app = FastAPI(
        title="QazMind API",
        version="0.1.0",
        lifespan=lifespan,
        docs_url=None if production_like else "/api/v1/docs",
        openapi_url=None if production_like else "/api/v1/openapi.json",
    )
    app.state.settings = settings
    app.state.engine = engine
    app.state.session_factory = session_factory
    app.state.mailer = mailer or build_mailer(settings)

    # Starlette runs the last-added middleware first: CORS -> request context -> CSRF -> routes.
    app.add_middleware(
        CsrfMiddleware,
        cookie_name=settings.csrf_cookie_name,
        protected_prefix="/api/v1",
        allowed_origins=settings.api_cors_origins,
    )
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.api_cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "X-CSRF-Token", "X-Request-ID"],
        expose_headers=["X-Request-ID"],
    )

    register_error_handlers(app)
    app.include_router(api_router)
    return app


app = create_app()
