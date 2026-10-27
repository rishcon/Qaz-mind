import smtplib
from datetime import timedelta
from email.header import decode_header, make_header

import pytest
from sqlalchemy import update

from app.core.config import Settings
from app.core.time import utcnow
from app.models import AuthToken
from app.services import mail
from app.services.mail import MailDeliveryError, OutgoingEmail, SmtpMailer, build_mailer, build_message
from app.tests.helpers import EMAIL, NAME, PASSWORD, api_post


def _settings(**overrides) -> Settings:
    base = dict(
        app_env="test",
        database_url="postgresql+asyncpg://x@localhost/x",
        smtp_host="localhost",
        smtp_port=1025,
        smtp_starttls=False,
        mail_from="QazMind <noreply@qazmind.local>",
        mail_mode="smtp",
    )
    base.update(overrides)
    return Settings(**base)


def test_message_is_utf8_with_readable_russian_subject_and_body():
    message = OutgoingEmail(to=EMAIL, subject="QazMind: подтвердите email", text="Ссылка: http://app.test/x?token=abc")
    email = build_message(message, "QazMind <noreply@qazmind.local>")

    assert email["To"] == EMAIL
    assert email["From"] == "QazMind <noreply@qazmind.local>"
    decoded_subject = str(make_header(decode_header(str(email["Subject"]))))
    assert decoded_subject == message.subject
    body = email.get_content()
    assert "Ссылка" in body
    assert "token=abc" in body


class _FakeSmtp:
    calls: list = []
    fail_send: Exception | None = None

    def __init__(self, host, port, timeout):
        _FakeSmtp.calls.append(("connect", host, port, timeout))

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def ehlo(self):
        _FakeSmtp.calls.append(("ehlo",))

    def starttls(self, context=None):
        _FakeSmtp.calls.append(("starttls",))

    def login(self, user, password):
        _FakeSmtp.calls.append(("login", user, password))

    def send_message(self, email):
        if _FakeSmtp.fail_send:
            raise _FakeSmtp.fail_send
        _FakeSmtp.calls.append(("send", email["To"]))


@pytest.fixture
def fake_smtp(monkeypatch):
    _FakeSmtp.calls = []
    _FakeSmtp.fail_send = None
    monkeypatch.setattr(mail.smtplib, "SMTP", _FakeSmtp)
    return _FakeSmtp


async def test_smtp_mailer_logs_in_only_when_credentials_are_set(fake_smtp):
    settings = _settings(smtp_username="sender@example.org", smtp_password="app-password")
    await SmtpMailer(settings).send(OutgoingEmail(to=EMAIL, subject="s", text="t"))
    assert ("login", "sender@example.org", "app-password") in fake_smtp.calls
    assert fake_smtp.calls[-1] == ("send", EMAIL)


async def test_smtp_mailer_without_credentials_sends_directly(fake_smtp):
    await SmtpMailer(_settings()).send(OutgoingEmail(to=EMAIL, subject="s", text="t"))
    assert not any(call[0] == "login" for call in fake_smtp.calls)
    assert fake_smtp.calls[-1] == ("send", EMAIL)


async def test_smtp_failure_becomes_a_delivery_error(fake_smtp):
    fake_smtp.fail_send = smtplib.SMTPServerDisconnected("connection lost")
    with pytest.raises(MailDeliveryError):
        await SmtpMailer(_settings()).send(OutgoingEmail(to=EMAIL, subject="s", text="t"))


def test_smtp_mode_needs_a_host():
    with pytest.raises(RuntimeError, match="SMTP_HOST"):
        build_mailer(_settings(smtp_host=None))


class _FailingMailer:
    async def send(self, message):
        raise MailDeliveryError("mail server is down")


async def test_registration_reports_mail_outage_and_recovers_on_retry(harness):
    harness.app.state.mailer = _FailingMailer()
    response = await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "MAIL_UNAVAILABLE"

    # Mail is back. The account exists but is not verified: registering again sends the verification mail
    # once the cooldown has passed.
    harness.app.state.mailer = harness.mailer
    async with harness.session_factory() as session:
        await session.execute(update(AuthToken).values(created_at=utcnow() - timedelta(minutes=5)))
        await session.commit()

    retry = await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})
    assert retry.status_code == 202
    assert len(harness.mailer.messages_to(EMAIL, "подтвердите email")) == 1
    assert harness.mailer.messages_to(EMAIL, "повторной регистрации") == []
