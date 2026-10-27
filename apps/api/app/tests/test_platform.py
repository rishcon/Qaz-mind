"""Health checks, password hashing, token helpers, configuration guards and schema-vs-migration checks."""

import pytest
from alembic.autogenerate import compare_metadata
from alembic.runtime.migration import MigrationContext

from app.core.config import Settings
from app.core.security import burn_password_time, generate_token, hash_password, hash_token, verify_password
from app.db.base import Base
from app.main import create_app


async def test_liveness_does_not_need_the_database(harness):
    response = await harness.http.get("/api/v1/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_readiness_checks_the_database(harness):
    response = await harness.http.get("/api/v1/health/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready", "database": "ok"}


def test_password_hash_is_argon2id_and_verifies():
    stored = hash_password("CorrectHorse42")
    assert stored.startswith("$argon2id$")
    assert verify_password(stored, "CorrectHorse42")
    assert not verify_password(stored, "correcthorse42")
    assert not verify_password("not-a-hash", "anything")


def test_token_helpers_store_only_a_digest():
    raw = generate_token()
    assert len(raw) >= 40
    assert raw != generate_token()
    digest = hash_token(raw)
    assert len(digest) == 64
    assert digest != raw
    assert digest == hash_token(raw)


def test_burn_password_time_never_raises():
    burn_password_time("anything")


def test_production_refuses_the_local_mailer():
    settings = Settings(
        app_env="production", database_url="postgresql+asyncpg://x@localhost/x", cookie_secure=True, mail_mode="dev_log"
    )
    with pytest.raises(RuntimeError, match="local-only"):
        create_app(settings)


def test_production_requires_secure_cookies():
    settings = Settings(
        app_env="staging", database_url="postgresql+asyncpg://x@localhost/x", cookie_secure=False, mail_mode="smtp", smtp_host="mail.example"
    )
    with pytest.raises(RuntimeError):
        settings.validate_for_environment()


async def test_migrations_produce_exactly_the_models_schema(harness):
    """Alembic autogenerate compares the migrated database with the SQLAlchemy models: no differences allowed."""

    def compare(sync_connection):
        context = MigrationContext.configure(
            sync_connection,
            opts={"compare_type": True, "include_object": lambda obj, name, typ, reflected, compare_to: not (
                typ == "table" and name == "alembic_version"
            )},
        )
        return compare_metadata(context, Base.metadata)

    async with harness.app.state.engine.connect() as connection:
        differences = await connection.run_sync(compare)
    assert differences == []
