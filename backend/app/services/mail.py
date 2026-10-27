import asyncio
import logging
import smtplib
import ssl
from dataclasses import dataclass
from email.message import EmailMessage
from typing import Protocol

from app.core.config import Settings

mail_logger = logging.getLogger("qazmind.mail")


class MailDeliveryError(Exception):
    """The mail server did not accept the message. The caller decides how to report it to the user."""


@dataclass(frozen=True)
class OutgoingEmail:
    to: str
    subject: str
    text: str


class Mailer(Protocol):
    async def send(self, message: OutgoingEmail) -> None: ...


def build_message(message: OutgoingEmail, sender: str) -> EmailMessage:
    """Plain-text UTF-8 message. Non-ASCII subjects and bodies are encoded by the email library."""
    email = EmailMessage()
    email["From"] = sender
    email["To"] = message.to
    email["Subject"] = message.subject
    email.set_content(message.text, charset="utf-8")
    return email


class DevLogMailer:
    """LOCAL TESTS ONLY. Nothing is delivered; the message is written to the server log.

    Use MAIL_MODE=smtp with Mailpit for everyday local work. Staging and production refuse this mailer.
    """

    async def send(self, message: OutgoingEmail) -> None:
        mail_logger.warning(
            "DEV MAIL (not delivered, MAIL_MODE=dev_log) to=%s subject=%s\n%s",
            message.to,
            message.subject,
            message.text,
        )


class SmtpMailer:
    """Sends through any SMTP server. The blocking smtplib calls run in a worker thread."""

    def __init__(self, settings: Settings) -> None:
        if not settings.smtp_host:
            raise RuntimeError("MAIL_MODE=smtp needs SMTP_HOST")
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.username = settings.smtp_username
        self.password = settings.smtp_password.get_secret_value() if settings.smtp_password else None
        self.starttls = settings.smtp_starttls
        self.timeout = settings.smtp_timeout_seconds
        self.sender = settings.mail_from

    async def send(self, message: OutgoingEmail) -> None:
        email = build_message(message, self.sender)
        try:
            await asyncio.to_thread(self._send_blocking, email)
        except (smtplib.SMTPException, OSError) as error:
            # The body is not logged: it contains one-time links.
            mail_logger.error("SMTP delivery failed to=%s subject=%s error=%s", message.to, message.subject, error)
            raise MailDeliveryError(str(error)) from error
        mail_logger.info("mail sent to=%s subject=%s", message.to, message.subject)

    def _send_blocking(self, email: EmailMessage) -> None:
        with smtplib.SMTP(self.host, self.port, timeout=self.timeout) as smtp:
            smtp.ehlo()
            if self.starttls:
                smtp.starttls(context=ssl.create_default_context())
                smtp.ehlo()
            if self.username and self.password:
                smtp.login(self.username, self.password)
            smtp.send_message(email)


def build_mailer(settings: Settings) -> Mailer:
    settings.validate_mail()
    if settings.mail_mode == "dev_log":
        return DevLogMailer()
    return SmtpMailer(settings)
