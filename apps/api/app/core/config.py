from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration. Every value can be overridden with an environment variable of the same name."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: Literal["local", "test", "staging", "production"] = "local"
    database_url: str = "postgresql+asyncpg://qazmind:qazmind@localhost:5432/qazmind"

    # Public URL of the React app. Used to build links inside emails.
    public_app_url: str = "http://localhost:5173"
    # Frontend origins allowed to call the API with credentials (cookies): QazMind Web and QazMind Admin.
    # Never use a wildcard together with credentials. Production origins come from the environment.
    api_cors_origins: list[str] = ["http://localhost:5173", "http://localhost:5174"]

    session_ttl_days: int = 14
    session_cookie_name: str = "qm_session"
    csrf_cookie_name: str = "qm_csrf"
    # Must be True behind HTTPS (staging/production). Enforced by validate_for_environment().
    cookie_secure: bool = False

    email_verification_ttl_hours: int = 24
    password_reset_ttl_minutes: int = 60
    auth_token_resend_cooldown_seconds: int = 60

    login_max_failures: int = 5
    login_lock_minutes: int = 15

    # "dev_log" writes emails to the server log and delivers nothing. Only for tests.
    # "smtp" sends through any SMTP server: Mailpit locally (see docker-compose.yml), a provider later.
    mail_mode: Literal["dev_log", "smtp"] = "dev_log"
    mail_from: str = "QazMind <noreply@qazmind.local>"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    # STARTTLS upgrades the connection before login. Mailpit does not support it, so it is off for local use.
    smtp_starttls: bool = True
    smtp_timeout_seconds: int = 10

    @property
    def is_production_like(self) -> bool:
        return self.app_env in ("staging", "production")

    def validate_for_environment(self) -> None:
        if not self.is_production_like:
            return
        if self.mail_mode == "dev_log":
            raise RuntimeError("MAIL_MODE=dev_log is local-only: staging and production must send real email")
        if not self.cookie_secure:
            raise RuntimeError("COOKIE_SECURE must be true in staging/production")

    def validate_mail(self) -> None:
        if self.mail_mode == "smtp" and not self.smtp_host:
            raise RuntimeError("MAIL_MODE=smtp needs SMTP_HOST")


@lru_cache
def get_settings() -> Settings:
    return Settings()
