"""Import every model so that Base.metadata knows all tables (used by Alembic and tests)."""

from app.models.admin import AuditEvent, StaffInvitation, StaffMember, StaffRole, StaffSession
from app.models.auth import AuthSession, AuthToken
from app.models.content import CurriculumTopic, Lesson, LessonVersion, Subject
from app.models.learning import LessonProgress
from app.models.profile import ProfilePair, StudentProfile
from app.models.question import Question
from app.models.user import User

__all__ = [
    "AuditEvent",
    "AuthSession",
    "AuthToken",
    "CurriculumTopic",
    "Lesson",
    "LessonProgress",
    "LessonVersion",
    "ProfilePair",
    "Question",
    "StaffInvitation",
    "StaffMember",
    "StaffRole",
    "StaffSession",
    "StudentProfile",
    "Subject",
    "User",
]
