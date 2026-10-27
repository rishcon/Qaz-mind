import logging
from dataclasses import dataclass
from typing import Protocol

from app.core.config import Settings

mail_logger = logging.getLogger("qazmind.mail")


@dataclass(frozen=True)
class OutgoingEmail:
    to: str
    subject: str
    text: str


class Mailer(Protocol):
    async def send(self, message: OutgoingEmail) -> None: ...


class DevLogMailer:
    """LOCAL DEVELOPMENT ONLY. Nothing is delivered; the message is written to the server log.

    The log contains one-time links, so this mode must never run where real users exist.
    Settings.validate_for_environment() refuses to start staging/production with this mailer.
    """

    async def send(self, message: OutgoingEmail) -> None:
        mail_logger.warning(
            "DEV MAIL (not delivered, MAIL_MODE=dev_log) to=%s subject=%s\n%s",
            message.to,
            message.subject,
            message.text,
        )


def build_mailer(settings: Settings) -> Mailer:
    if settings.mail_mode == "dev_log":
        return DevLogMailer()
    raise RuntimeError(f"Unsupported MAIL_MODE: {settings.mail_mode}")
