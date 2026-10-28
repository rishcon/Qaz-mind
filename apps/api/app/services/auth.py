from collections.abc import Callable
from datetime import timedelta
from typing import NamedTuple

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.errors import AppError
from app.core.security import (
    burn_password_time,
    generate_token,
    hash_password,
    hash_token,
    normalize_email,
    verify_password,
)
from app.core.time import utcnow
from app.models import AuthSession, AuthToken, User
from app.services.mail import MailDeliveryError, Mailer, OutgoingEmail

INVALID_CREDENTIALS = "Неверный логин или пароль"
INVALID_TOKEN = "Ссылка недействительна или срок её действия истёк"


class SessionContext(NamedTuple):
    session: AuthSession
    user: User


class AuthService:
    def __init__(self, db: AsyncSession, settings: Settings, mailer: Mailer) -> None:
        self.db = db
        self.settings = settings
        self.mailer = mailer

    # ----- registration and email verification -------------------------------------------------

    async def register(
        self,
        name: str,
        email: str,
        password: str,
        account_type: str = "student",
        on_created: Callable[[User], None] | None = None,
    ) -> None:
        email = normalize_email(email)
        # Hash before the lookup so that existing and new emails take the same time to answer.
        password_hash = hash_password(password)
        existing = await self._user_by_email(email)
        if existing is not None and existing.email_verified_at is None and existing.status == "active":
            # The first verification mail may have failed; sending it again (subject to the cooldown) is the fix.
            await self.resend_verification(email)
            return
        if existing is not None:
            # Do not reveal that the account exists: the response is identical, the owner gets a notice.
            await self._deliver(
                OutgoingEmail(
                    to=email,
                    subject="QazMind: попытка повторной регистрации",
                    text=(
                        "Для этого адреса уже создан аккаунт QazMind.\n"
                        f"Войти: {self.settings.public_app_url}/login\n"
                        "Если это были не вы, просто проигнорируйте письмо."
                    ),
                )
            )
            return

        user = User(email=email, name=name, password_hash=password_hash, account_type=account_type)
        self.db.add(user)
        await self.db.flush()
        if on_created is not None:
            on_created(user)
        raw = await self._issue_token(user, "verify_email", timedelta(hours=self.settings.email_verification_ttl_hours))
        await self._send_verification(email, raw)

    async def resend_verification(self, email: str) -> None:
        email = normalize_email(email)
        user = await self._user_by_email(email)
        if user is None or user.email_verified_at is not None or user.status != "active":
            return
        if await self._recent_token_exists(user, "verify_email"):
            return
        raw = await self._issue_token(user, "verify_email", timedelta(hours=self.settings.email_verification_ttl_hours))
        await self._send_verification(user.email, raw)

    async def verify_email(self, raw_token: str) -> tuple[SessionContext, str]:
        token = await self._consume_token(raw_token, "verify_email")
        user = await self.db.get(User, token.user_id)
        if user is None or user.status != "active":
            raise AppError(403, "ACCOUNT_DISABLED", "Аккаунт недоступен")
        if user.email_verified_at is None:
            user.email_verified_at = utcnow()
        session, raw_session = await self._create_session(user, revoke_raw=None)
        return SessionContext(session=session, user=user), raw_session

    # ----- login, logout, sessions -----------------------------------------------------------------

    async def login(self, identifier: str, password: str, current_raw_session: str | None) -> tuple[AuthSession, User, str]:
        """`identifier` is an e-mail address or, for accounts created by a school, a login."""
        identifier = identifier.strip().lower()
        user = await self._user_by_email(identifier) if "@" in identifier else await self._user_by_username(identifier)
        if user is None:
            burn_password_time(password)
            raise AppError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS)

        now = utcnow()
        if user.locked_until is not None and user.locked_until > now:
            raise AppError(429, "ACCOUNT_LOCKED", "Слишком много неудачных попыток. Попробуйте позже.")

        if not verify_password(user.password_hash, password):
            user.failed_login_count += 1
            if user.failed_login_count >= self.settings.login_max_failures:
                user.locked_until = now + timedelta(minutes=self.settings.login_lock_minutes)
                user.failed_login_count = 0
            await self.db.commit()
            raise AppError(401, "INVALID_CREDENTIALS", INVALID_CREDENTIALS)

        # Checked only after the password is correct, so an attacker learns nothing without the password.
        if user.status != "active":
            raise AppError(403, "ACCOUNT_DISABLED", "Аккаунт недоступен")
        if user.email_verified_at is None:
            raise AppError(403, "EMAIL_NOT_VERIFIED", "Подтвердите email, чтобы войти")

        user.failed_login_count = 0
        user.locked_until = None
        session, raw_session = await self._create_session(user, revoke_raw=current_raw_session)
        return session, user, raw_session

    async def logout(self, raw_session: str) -> None:
        await self.db.execute(
            update(AuthSession)
            .where(AuthSession.token_hash == hash_token(raw_session), AuthSession.revoked_at.is_(None))
            .values(revoked_at=utcnow())
        )
        await self.db.commit()

    async def resolve_session(self, raw_session: str) -> SessionContext:
        now = utcnow()
        row = await self.db.execute(
            select(AuthSession, User)
            .join(User, User.id == AuthSession.user_id)
            .where(
                AuthSession.token_hash == hash_token(raw_session),
                AuthSession.revoked_at.is_(None),
                AuthSession.expires_at > now,
            )
        )
        found = row.first()
        if found is None or found[1].status != "active":
            raise AppError(401, "NOT_AUTHENTICATED", "Требуется вход в аккаунт")
        session, user = found
        if now - session.last_seen_at > timedelta(minutes=10):
            session.last_seen_at = now
            await self.db.commit()
        return SessionContext(session=session, user=user)

    # ----- password reset -----------------------------------------------------------------------

    async def request_password_reset(self, email: str) -> None:
        email = normalize_email(email)
        user = await self._user_by_email(email)
        if user is None or user.status != "active" or user.email_verified_at is None or user.account_type == "managed":
            # A school-created account has no mailbox: its password is reset by the school administrator.
            return
        if await self._recent_token_exists(user, "reset_password"):
            return
        raw = await self._issue_token(user, "reset_password", timedelta(minutes=self.settings.password_reset_ttl_minutes))
        link = f"{self.settings.public_app_url}/reset-password?token={raw}"
        await self._deliver(
            OutgoingEmail(
                to=user.email,
                subject="QazMind: восстановление пароля",
                text=f"Чтобы задать новый пароль, откройте ссылку (действует 60 минут):\n{link}\n"
                "Если вы не запрашивали восстановление, проигнорируйте письмо.",
            )
        )

    async def reset_password(self, raw_token: str, new_password: str) -> None:
        token = await self._consume_token(raw_token, "reset_password")
        user = await self.db.get(User, token.user_id)
        if user is None or user.status != "active":
            raise AppError(403, "ACCOUNT_DISABLED", "Аккаунт недоступен")
        now = utcnow()
        user.password_hash = hash_password(new_password)
        user.failed_login_count = 0
        user.locked_until = None
        # Following the reset link proves ownership of the mailbox.
        if user.email_verified_at is None:
            user.email_verified_at = now
        # A new password ends every existing session.
        await self.db.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None))
            .values(revoked_at=now)
        )
        await self.db.commit()

    # ----- helpers ---------------------------------------------------------------------------------

    async def _user_by_username(self, username: str) -> User | None:
        result = await self.db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    async def change_password(self, user: User, current: str, new: str, keep_session_id) -> None:
        if not verify_password(user.password_hash, current):
            raise AppError(400, "WRONG_PASSWORD", "Текущий пароль указан неверно")
        if current == new:
            raise AppError(422, "SAME_PASSWORD", "Новый пароль должен отличаться от текущего")
        user.password_hash = hash_password(new)
        user.must_change_password = False
        # Other devices are signed out; the one that changed the password stays.
        await self.db.execute(
            update(AuthSession)
            .where(AuthSession.user_id == user.id, AuthSession.revoked_at.is_(None), AuthSession.id != keep_session_id)
            .values(revoked_at=utcnow())
        )
        await self.db.commit()

    async def _user_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def _recent_token_exists(self, user: User, purpose: str) -> bool:
        cooldown_start = utcnow() - timedelta(seconds=self.settings.auth_token_resend_cooldown_seconds)
        result = await self.db.execute(
            select(AuthToken.id).where(
                AuthToken.user_id == user.id,
                AuthToken.purpose == purpose,
                AuthToken.created_at > cooldown_start,
            )
        )
        return result.first() is not None

    async def _deliver(self, message: OutgoingEmail) -> None:
        try:
            await self.mailer.send(message)
        except MailDeliveryError as error:
            # The token is already stored; the user can request the mail again once the cooldown has passed.
            raise AppError(503, "MAIL_UNAVAILABLE", "Не удалось отправить письмо. Попробуйте позже.") from error

    async def _issue_token(self, user: User, purpose: str, ttl: timedelta) -> str:
        raw = generate_token()
        self.db.add(
            AuthToken(
                user_id=user.id,
                purpose=purpose,
                token_hash=hash_token(raw),
                expires_at=utcnow() + ttl,
            )
        )
        await self.db.commit()
        return raw

    async def _consume_token(self, raw_token: str, purpose: str) -> AuthToken:
        """Atomically mark the token as used. A second use, or an expired token, is refused."""
        now = utcnow()
        digest = hash_token(raw_token)
        record = (
            await self.db.execute(select(AuthToken).where(AuthToken.token_hash == digest, AuthToken.purpose == purpose))
        ).scalar_one_or_none()
        if record is None or record.expires_at <= now:
            raise AppError(400, "INVALID_OR_EXPIRED_TOKEN", INVALID_TOKEN)
        result = await self.db.execute(
            update(AuthToken)
            .where(AuthToken.id == record.id, AuthToken.consumed_at.is_(None))
            .values(consumed_at=now)
        )
        if result.rowcount != 1:
            await self.db.rollback()
            raise AppError(400, "INVALID_OR_EXPIRED_TOKEN", INVALID_TOKEN)
        await self.db.commit()
        return record

    async def _create_session(self, user: User, revoke_raw: str | None) -> tuple[AuthSession, str]:
        now = utcnow()
        if revoke_raw:
            # Session rotation: the session that was used to log in cannot be reused afterwards.
            await self.db.execute(
                update(AuthSession)
                .where(AuthSession.token_hash == hash_token(revoke_raw), AuthSession.revoked_at.is_(None))
                .values(revoked_at=now)
            )
        raw = generate_token()
        session = AuthSession(
            user_id=user.id,
            token_hash=hash_token(raw),
            created_at=now,
            last_seen_at=now,
            expires_at=now + timedelta(days=self.settings.session_ttl_days),
        )
        self.db.add(session)
        await self.db.commit()
        return session, raw

    async def _send_verification(self, email: str, raw: str) -> None:
        link = f"{self.settings.public_app_url}/verify-email?token={raw}"
        await self._deliver(
            OutgoingEmail(
                to=email,
                subject="QazMind: подтвердите email",
                text=f"Подтвердите адрес почты, открыв ссылку (действует 24 часа):\n{link}",
            )
        )
