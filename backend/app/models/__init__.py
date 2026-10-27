"""Import every model so that Base.metadata knows all tables (used by Alembic and tests)."""

from app.models.auth import AuthSession, AuthToken
from app.models.profile import ProfilePair, StudentProfile
from app.models.user import User

__all__ = ["AuthSession", "AuthToken", "ProfilePair", "StudentProfile", "User"]
