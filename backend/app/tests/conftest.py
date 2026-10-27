import os
import pathlib
import re
import subprocess
import sys
from collections.abc import AsyncIterator, Iterator
from dataclasses import dataclass, field

import pytest
import pytest_asyncio
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.core.config import Settings
from app.main import create_app
from app.services.mail import OutgoingEmail

BACKEND_DIR = pathlib.Path(__file__).resolve().parents[2]
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "")
TOKEN_PATTERN = re.compile(r"token=([A-Za-z0-9_\-]+)")
TABLES_TO_CLEAN = "users, sessions, auth_tokens, student_profiles"


class CapturingMailer:
    """Test double for the mailer: keeps every message in memory instead of logging it."""

    def __init__(self) -> None:
        self.sent: list[OutgoingEmail] = []

    async def send(self, message: OutgoingEmail) -> None:
        self.sent.append(message)

    def messages_to(self, email: str, subject_part: str) -> list[OutgoingEmail]:
        return [m for m in self.sent if m.to == email and subject_part in m.subject]

    def token_for(self, email: str, subject_part: str) -> str:
        """Extract the raw token from the most recent matching email."""
        matches = self.messages_to(email, subject_part)
        assert matches, f"no email to {email} with subject containing {subject_part!r}"
        found = TOKEN_PATTERN.search(matches[-1].text)
        assert found, "email does not contain a token link"
        return found.group(1)


@dataclass
class Harness:
    app: FastAPI
    http: AsyncClient
    mailer: CapturingMailer
    settings: Settings
    session_factory: async_sessionmaker = field(repr=False)

    async def new_client(self) -> AsyncClient:
        """A second, independent browser (own cookie jar) talking to the same app."""
        return AsyncClient(transport=ASGITransport(app=self.app), base_url="http://testserver")


@pytest.fixture(scope="session", autouse=True)
def migrated_database() -> Iterator[None]:
    """Rebuild the test schema with Alembic: downgrade to empty, then upgrade to head."""
    if not TEST_DATABASE_URL:
        pytest.fail("Set TEST_DATABASE_URL to an isolated PostgreSQL database for the test run")
    env = {**os.environ, "DATABASE_URL": TEST_DATABASE_URL}
    for command in (["downgrade", "base"], ["upgrade", "head"]):
        completed = subprocess.run(
            [sys.executable, "-m", "alembic", *command],
            cwd=BACKEND_DIR,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        assert completed.returncode == 0, completed.stderr
    yield


@pytest.fixture
def settings() -> Settings:
    return Settings(
        app_env="test",
        database_url=TEST_DATABASE_URL,
        public_app_url="http://app.test",
        api_cors_origins=["http://app.test"],
        cookie_secure=False,
    )


@pytest_asyncio.fixture
async def harness(migrated_database, settings: Settings) -> AsyncIterator[Harness]:
    mailer = CapturingMailer()
    app = create_app(settings, mailer=mailer)
    session_factory = app.state.session_factory
    async with session_factory() as session:
        await session.execute(text(f"TRUNCATE {TABLES_TO_CLEAN} RESTART IDENTITY CASCADE"))
        await session.commit()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver") as http:
        yield Harness(app=app, http=http, mailer=mailer, settings=settings, session_factory=session_factory)
    await app.state.engine.dispose()
