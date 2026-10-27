from datetime import timedelta

from httpx import ASGITransport, AsyncClient
from sqlalchemy import update

from app.core.time import utcnow
from app.models import AuthToken, User
from app.tests.helpers import EMAIL, NAME, PASSWORD, api_post, register_and_verify


async def _update_user(harness, email: str, **values) -> None:
    async with harness.session_factory() as session:
        await session.execute(update(User).where(User.email == email).values(**values))
        await session.commit()


async def _get_with_session(harness, path: str, raw_session: str):
    """A request from a client that carries only this one session cookie (no shared cookie jar)."""
    async with AsyncClient(
        transport=ASGITransport(app=harness.app),
        base_url="http://testserver",
        cookies={"qm_session": raw_session},
    ) as client:
        return await client.get(path)


async def test_register_sends_one_verification_mail_and_hides_existing_accounts(harness):
    response = await api_post(
        harness.http, "/api/v1/auth/register", {"name": NAME, "email": "Aliya@QazMind.kz", "password": PASSWORD}
    )
    assert response.status_code == 202
    assert response.json() == {"status": "check_email"}
    assert len(harness.mailer.messages_to(EMAIL, "подтвердите email")) == 1

    # Same address in other case: identical answer, no second account, no second verification mail.
    again = await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})
    assert again.status_code == 202
    assert again.json() == {"status": "check_email"}
    assert len(harness.mailer.messages_to(EMAIL, "подтвердите email")) == 1
    assert len(harness.mailer.messages_to(EMAIL, "повторной регистрации")) == 1


async def test_login_checks_password_then_verification(harness):
    await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})

    wrong = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": "wrong-password"})
    assert wrong.status_code == 401
    assert wrong.json()["error"]["code"] == "INVALID_CREDENTIALS"

    unknown = await api_post(harness.http, "/api/v1/auth/login", {"email": "nobody@qazmind.kz", "password": PASSWORD})
    assert unknown.status_code == 401
    # Unknown accounts get exactly the same answer as wrong passwords.
    assert unknown.json()["error"]["message"] == wrong.json()["error"]["message"]

    unverified = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": PASSWORD})
    assert unverified.status_code == 403
    assert unverified.json()["error"]["code"] == "EMAIL_NOT_VERIFIED"


async def test_verification_creates_session_and_token_is_single_use(harness):
    await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})
    token = harness.mailer.token_for(EMAIL, "подтвердите email")

    response = await api_post(harness.http, "/api/v1/auth/verify-email", {"token": token})
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email_verified"] is True
    assert body["onboarding_completed"] is False
    assert "HttpOnly" in response.headers["set-cookie"]
    assert "qm_session=" in response.headers["set-cookie"]

    me = await harness.http.get("/api/v1/auth/me")
    assert me.status_code == 200

    reused = await api_post(harness.http, "/api/v1/auth/verify-email", {"token": token})
    assert reused.status_code == 400
    assert reused.json()["error"]["code"] == "INVALID_OR_EXPIRED_TOKEN"


async def test_expired_verification_token_is_rejected(harness):
    await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})
    token = harness.mailer.token_for(EMAIL, "подтвердите email")
    async with harness.session_factory() as session:
        await session.execute(update(AuthToken).values(expires_at=utcnow() - timedelta(minutes=1)))
        await session.commit()

    response = await api_post(harness.http, "/api/v1/auth/verify-email", {"token": token})
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_OR_EXPIRED_TOKEN"


async def test_login_rotates_session_and_logout_revokes_it(harness):
    await register_and_verify(harness)
    first_session = harness.http.cookies.get("qm_session")

    login = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": PASSWORD})
    assert login.status_code == 200
    second_session = harness.http.cookies.get("qm_session")
    assert second_session != first_session

    # The session replaced by the login no longer works.
    stale = await _get_with_session(harness, "/api/v1/auth/me", first_session)
    assert stale.status_code == 401

    logout = await api_post(harness.http, "/api/v1/auth/logout")
    assert logout.status_code == 204
    # The server-side session is revoked, so even a replayed cookie is refused.
    replay = await _get_with_session(harness, "/api/v1/auth/me", second_session)
    assert replay.status_code == 401
    assert replay.json()["error"]["code"] == "NOT_AUTHENTICATED"


async def test_repeated_wrong_passwords_lock_the_account_until_expiry(harness):
    await register_and_verify(harness)
    await api_post(harness.http, "/api/v1/auth/logout")

    for _ in range(harness.settings.login_max_failures):
        response = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": "bad-guess-1"})
        assert response.status_code == 401

    locked = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": PASSWORD})
    assert locked.status_code == 429
    assert locked.json()["error"]["code"] == "ACCOUNT_LOCKED"

    await _update_user(harness, EMAIL, locked_until=utcnow() - timedelta(seconds=1))
    unlocked = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": PASSWORD})
    assert unlocked.status_code == 200


async def test_resend_verification_respects_cooldown_and_unknown_addresses(harness):
    await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})

    resend = await api_post(harness.http, "/api/v1/auth/resend-verification", {"email": EMAIL})
    assert resend.status_code == 202
    # The 60 s cooldown is still running: no second token, no second mail.
    assert len(harness.mailer.messages_to(EMAIL, "подтвердите email")) == 1

    unknown = await api_post(harness.http, "/api/v1/auth/resend-verification", {"email": "ghost@qazmind.kz"})
    assert unknown.status_code == 202
    assert harness.mailer.messages_to("ghost@qazmind.kz", "подтвердите email") == []


async def test_password_reset_changes_password_and_ends_all_sessions(harness):
    await register_and_verify(harness)
    old_session = harness.http.cookies.get("qm_session")

    forgot = await api_post(harness.http, "/api/v1/auth/password/forgot", {"email": EMAIL})
    assert forgot.status_code == 202
    token = harness.mailer.token_for(EMAIL, "восстановление пароля")

    new_password = "NewHorse-2026"
    reset = await api_post(harness.http, "/api/v1/auth/password/reset", {"token": token, "password": new_password})
    assert reset.status_code == 200
    assert reset.json() == {"status": "password_updated"}

    stale = await _get_with_session(harness, "/api/v1/auth/me", old_session)
    assert stale.status_code == 401

    old_login = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": PASSWORD})
    assert old_login.status_code == 401
    new_login = await api_post(harness.http, "/api/v1/auth/login", {"email": EMAIL, "password": new_password})
    assert new_login.status_code == 200

    reused = await api_post(harness.http, "/api/v1/auth/password/reset", {"token": token, "password": "Third-Pass-99"})
    assert reused.status_code == 400


async def test_password_reset_mail_is_not_sent_for_unknown_accounts(harness):
    response = await api_post(harness.http, "/api/v1/auth/password/forgot", {"email": "ghost@qazmind.kz"})
    assert response.status_code == 202
    assert harness.mailer.sent == []


async def test_state_changing_requests_need_matching_csrf_header(harness):
    await api_post(harness.http, "/api/v1/auth/register", {"name": NAME, "email": EMAIL, "password": PASSWORD})

    no_header = await harness.http.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert no_header.status_code == 403
    assert no_header.json()["error"]["code"] == "CSRF_INVALID"

    forged = await harness.http.post(
        "/api/v1/auth/login",
        json={"email": EMAIL, "password": PASSWORD},
        headers={"X-CSRF-Token": "forged-value"},
    )
    assert forged.status_code == 403


async def test_validation_errors_use_the_error_envelope_without_echoing_input(harness):
    response = await api_post(
        harness.http, "/api/v1/auth/register", {"name": NAME, "email": "not-an-email", "password": "short"}
    )
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["request_id"]
    assert {detail["field"] for detail in error["details"]} >= {"email", "password"}
    assert "short" not in response.text


async def test_me_requires_a_session(harness):
    response = await harness.http.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "NOT_AUTHENTICATED"


async def test_responses_carry_a_request_id(harness):
    response = await harness.http.get("/api/v1/health/live", headers={"X-Request-ID": "trace-abcdef12"})
    assert response.headers["X-Request-ID"] == "trace-abcdef12"

    generated = await harness.http.get("/api/v1/health/live", headers={"X-Request-ID": "bad id!"})
    assert generated.headers["X-Request-ID"] != "bad id!"
