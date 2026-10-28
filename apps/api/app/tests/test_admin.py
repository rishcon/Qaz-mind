"""Staff sign-in, permissions and the admin data endpoints."""

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from app.admin import totp
from app.admin.service import StaffService
from app.tests.helpers import EMAIL, PASSWORD, api_post, api_put, register_and_verify

STAFF_PASSWORD = "Staff-Password-2026"


async def invite_and_accept(harness, email: str, roles: list[str], name: str = "Сотрудник") -> None:
    async with harness.session_factory() as db:
        raw = await StaffService(db, harness.settings, harness.mailer).create_invitation(email, name, roles, None, None)
    response = await api_post(harness.http, "/api/v1/admin/auth/invitations/accept",
                              {"token": raw, "name": name, "password": STAFF_PASSWORD})
    assert response.status_code == 200, response.text


async def sign_in(harness, email: str) -> tuple[AsyncClient, str]:
    """Password, then TOTP enrolment and confirmation. Returns a client with a full staff session and the secret."""
    client = await harness.new_client()
    response = await api_post(client, "/api/v1/admin/auth/login", {"email": email, "password": STAFF_PASSWORD})
    assert response.status_code == 200, response.text
    assert response.json()["next"] == "mfa_setup"
    secret = (await client.get("/api/v1/admin/auth/mfa/setup")).json()["secret"]
    response = await api_post(client, "/api/v1/admin/auth/mfa", {"code": totp.code_at(secret, totp.current_step())})
    assert response.status_code == 200, response.text
    return client, secret


async def staff(harness, email: str, roles: list[str]) -> AsyncClient:
    await invite_and_accept(harness, email, roles)
    client, _ = await sign_in(harness, email)
    return client


def question(subject: str = "history_kz", **extra) -> dict:
    body = {
        "subject_id": subject,
        "difficulty": "medium",
        "text_ru": "Вопрос для проверки процесса рецензии?",
        "options": [
            {"label": "A", "text_ru": "первый"},
            {"label": "B", "text_ru": "второй"},
            {"label": "C", "text_ru": "третий"},
            {"label": "D", "text_ru": "четвёртый"},
        ],
        "correct_label": "B",
        "explanation_ru": "Пояснение к ответу.",
    }
    body.update(extra)
    return body


def imported(external_id: str, subject: str = "history_kz", **extra) -> dict:
    """A row that satisfies the stricter import rules: an ID and a source."""
    return question(subject, external_id=external_id, source_reference="Учебник, §1", **extra)


async def test_admin_endpoints_need_a_staff_session(harness):
    assert (await harness.http.get("/api/v1/admin/overview")).status_code == 401
    # A student session is not a staff session.
    await register_and_verify(harness)
    assert (await harness.http.get("/api/v1/admin/overview")).status_code == 401


async def test_password_alone_does_not_open_the_admin(harness):
    await invite_and_accept(harness, "owner@qazmind.kz", ["OWNER"])
    client = await harness.new_client()
    await api_post(client, "/api/v1/admin/auth/login", {"email": "owner@qazmind.kz", "password": STAFF_PASSWORD})
    response = await client.get("/api/v1/admin/overview")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "MFA_REQUIRED"


async def test_wrong_password_and_wrong_code_are_refused(harness):
    await invite_and_accept(harness, "owner@qazmind.kz", ["OWNER"])
    client = await harness.new_client()
    response = await api_post(client, "/api/v1/admin/auth/login", {"email": "owner@qazmind.kz", "password": "wrong-password-1"})
    assert response.status_code == 401
    await api_post(client, "/api/v1/admin/auth/login", {"email": "owner@qazmind.kz", "password": STAFF_PASSWORD})
    await client.get("/api/v1/admin/auth/mfa/setup")
    response = await api_post(client, "/api/v1/admin/auth/mfa", {"code": "000000"})
    assert response.status_code == 400


async def test_a_totp_code_cannot_be_used_twice(harness):
    await invite_and_accept(harness, "owner@qazmind.kz", ["OWNER"])
    _, secret = await sign_in(harness, "owner@qazmind.kz")
    async with harness.session_factory() as db:
        used_step = (await db.execute(text("SELECT totp_last_step FROM staff_members"))).scalar_one()
    code = totp.code_at(secret, used_step)
    second = await harness.new_client()
    await api_post(second, "/api/v1/admin/auth/login", {"email": "owner@qazmind.kz", "password": STAFF_PASSWORD})
    response = await api_post(second, "/api/v1/admin/auth/mfa", {"code": code})
    assert response.status_code == 400


async def test_invitation_link_works_once_and_needs_a_long_password(harness):
    async with harness.session_factory() as db:
        raw = await StaffService(db, harness.settings, harness.mailer).create_invitation(
            "new@qazmind.kz", "Новый", ["ANALYST"], None, None
        )
    short = await api_post(harness.http, "/api/v1/admin/auth/invitations/accept",
                           {"token": raw, "name": "Новый", "password": "short"})
    assert short.status_code == 422
    ok = await api_post(harness.http, "/api/v1/admin/auth/invitations/accept",
                        {"token": raw, "name": "Новый", "password": STAFF_PASSWORD})
    assert ok.status_code == 200
    again = await api_post(harness.http, "/api/v1/admin/auth/invitations/accept",
                           {"token": raw, "name": "Новый", "password": STAFF_PASSWORD})
    assert again.status_code == 400


async def test_roles_limit_what_staff_can_do(harness):
    content = await staff(harness, "content@qazmind.kz", ["CONTENT_MANAGER"])
    assert (await content.get("/api/v1/admin/users")).status_code == 403
    assert (await content.get("/api/v1/admin/staff")).status_code == 403
    assert (await content.get("/api/v1/admin/audit")).status_code == 403
    assert (await content.get("/api/v1/admin/questions")).status_code == 200
    analyst = await staff(harness, "analyst@qazmind.kz", ["ANALYST"])
    assert (await analyst.get("/api/v1/admin/users")).status_code == 200
    response = await api_post(analyst, "/api/v1/admin/questions", question())
    assert response.status_code == 403


async def test_owner_invites_staff_and_the_invitation_is_mailed(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    response = await api_post(owner, "/api/v1/admin/staff/invitations",
                              {"email": "Support@QazMind.kz", "name": "Поддержка", "roles": ["SUPPORT_AGENT"]})
    assert response.status_code == 201, response.text
    mail = harness.mailer.messages_to("support@qazmind.kz", "приглашение")
    assert mail and "/accept-invite?token=" in mail[-1].text
    listing = (await owner.get("/api/v1/admin/staff")).json()["items"]
    invited = next(m for m in listing if m["email"] == "support@qazmind.kz")
    assert invited["status"] == "invited" and invited["roles"] == ["SUPPORT_AGENT"]


async def test_owner_cannot_lock_themselves_out(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    me = (await owner.get("/api/v1/admin/auth/me")).json()["staff"]
    response = await api_put(owner, f"/api/v1/admin/staff/{me['id']}/roles", {"roles": ["ANALYST"]})
    assert response.status_code == 409
    response = await api_post(owner, f"/api/v1/admin/staff/{me['id']}/disable")
    assert response.status_code == 409


async def test_disabled_staff_lose_their_sessions(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    analyst = await staff(harness, "analyst@qazmind.kz", ["ANALYST"])
    target = next(m for m in (await owner.get("/api/v1/admin/staff")).json()["items"] if m["email"] == "analyst@qazmind.kz")
    assert (await api_post(owner, f"/api/v1/admin/staff/{target['id']}/disable")).status_code == 200
    assert (await analyst.get("/api/v1/admin/overview")).status_code == 401


async def test_author_cannot_approve_own_question_but_a_reviewer_can(harness):
    author = await staff(harness, "author@qazmind.kz", ["CONTENT_MANAGER", "CONTENT_REVIEWER"])
    created = await api_post(author, "/api/v1/admin/questions", question())
    assert created.status_code == 201, created.text
    qid = created.json()["id"]
    assert (await api_post(author, f"/api/v1/admin/questions/{qid}/transition", {"action": "submit"})).status_code == 200
    own = await api_post(author, f"/api/v1/admin/questions/{qid}/transition", {"action": "approve"})
    assert own.status_code == 409 and own.json()["error"]["code"] == "OWN_MATERIAL"
    reviewer = await staff(harness, "reviewer@qazmind.kz", ["CONTENT_REVIEWER"])
    assert (await api_post(reviewer, f"/api/v1/admin/questions/{qid}/transition", {"action": "approve"})).status_code == 200
    assert (await api_post(reviewer, f"/api/v1/admin/questions/{qid}/transition", {"action": "publish"})).status_code == 200
    assert (await reviewer.get(f"/api/v1/admin/questions/{qid}")).json()["status"] == "published"


async def test_question_is_validated_on_the_server(harness):
    author = await staff(harness, "author@qazmind.kz", ["CONTENT_MANAGER"])
    bad_subject = await api_post(author, "/api/v1/admin/questions", question(subject="nope_subject"))
    assert bad_subject.status_code == 422
    missing_answer = await api_post(author, "/api/v1/admin/questions", question(correct_label="E"))
    assert missing_answer.status_code == 422
    repeated = await api_post(
        author,
        "/api/v1/admin/questions",
        question(options=[{"label": "A", "text_ru": "один"}, {"label": "B", "text_ru": "Один"}], correct_label="A"),
    )
    assert repeated.status_code == 422
    import_bad = await api_post(
        author,
        "/api/v1/admin/questions/import",
        {"rows": [imported("a-1"), imported("a-2", subject="nope_subject")]},
    )
    assert import_bad.status_code == 422
    assert "Строка 2" in import_bad.json()["error"]["message"]
    listing = (await author.get("/api/v1/admin/questions")).json()
    assert listing["total"] == 0  # the whole file was rejected


async def test_import_needs_id_and_source_and_dry_run_writes_nothing(harness):
    author = await staff(harness, "author@qazmind.kz", ["CONTENT_MANAGER"])
    url = "/api/v1/admin/questions/import"
    rows = [
        imported("ok-1"),
        question(),  # no external_id, no source
        imported("EXAMPLE-1"),
        imported("ok-1", text_ru="Другой вопрос про то же самое?"),
    ]
    checked = await api_post(author, url + "?dry_run=true", {"rows": rows})
    assert checked.status_code == 200
    report = checked.json()
    messages = {(e["row"], e["message"]) for e in report["errors"]}
    assert (2, "не указан external_id") in messages
    assert (2, "не указан источник (source)") in messages
    assert any(r == 3 and "пример" in m for r, m in messages)
    assert any(r == 4 and "повторяет строку 1" in m for r, m in messages)
    assert report["valid"] == 1
    assert (await author.get("/api/v1/admin/questions")).json()["total"] == 0

    done = await api_post(author, url, {"rows": [imported("ok-1")]})
    assert done.status_code == 201 and done.json() == {"created": 1}

    again = await api_post(author, url + "?dry_run=true", {"rows": [imported("ok-1"), imported("ok-2")]})
    report = again.json()
    assert [(e["row"], "уже есть в банке" in e["message"]) for e in report["errors"]] == [(1, True)]
    assert any(w["row"] == 1 and "уже есть в банке" in w["message"] for w in report["warnings"])
    assert report["valid"] == 1


async def test_disabling_a_student_ends_their_sessions_and_blocks_login(harness):
    await register_and_verify(harness)
    admin = await staff(harness, "admin@qazmind.kz", ["PLATFORM_ADMIN"])
    users = (await admin.get("/api/v1/admin/users")).json()
    assert users["total"] == 1 and users["items"][0]["email"] == EMAIL
    uid = users["items"][0]["id"]
    response = await api_post(admin, f"/api/v1/admin/users/{uid}/status", {"status": "disabled", "reason": "проверка"})
    assert response.status_code == 200
    assert (await harness.http.get("/api/v1/auth/me")).status_code == 401
    student = await harness.new_client()
    login = await api_post(student, "/api/v1/auth/login", {"email": EMAIL, "password": PASSWORD})
    assert login.status_code in (401, 403)


async def test_overview_counts_real_rows(harness):
    await register_and_verify(harness)
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    data = (await owner.get("/api/v1/admin/overview")).json()
    assert data["users_total"] == 1
    assert data["users_verified"] == 1
    assert data["questions"]["draft"] == 0
    assert sum(day["count"] for day in data["registrations_by_day"]) == 1


async def test_audit_log_records_actions_and_cannot_be_changed(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    await api_post(owner, "/api/v1/admin/questions", question())
    actions = [e["action"] for e in (await owner.get("/api/v1/admin/audit")).json()["items"]]
    assert "question.created" in actions and "staff.mfa_enrolled" in actions
    async with harness.session_factory() as db:
        with pytest.raises(Exception):
            await db.execute(text("UPDATE audit_events SET action = 'x'"))
            await db.commit()


async def test_lesson_author_cannot_publish_own_version(harness):
    manager = await staff(harness, "author@qazmind.kz", ["CONTENT_MANAGER", "CONTENT_REVIEWER"])
    topic = await api_post(manager, "/api/v1/admin/topics",
                           {"subject_id": "history_kz", "slug": "test-topic", "title_ru": "Тема", "title_kz": "Тақырып"})
    assert topic.status_code == 201, topic.text
    step = {"heading_ru": "Шаг", "heading_kz": "Қадам", "body_ru": "Текст", "body_kz": "Мәтін"}
    lesson = await api_post(manager, "/api/v1/admin/lessons", {
        "topic_id": topic.json()["id"], "slug": "test-lesson", "title_ru": "Урок", "title_kz": "Сабақ",
        "estimated_minutes": 10, "source_reference": "Учебник, стр. 1", "steps": [step],
    })
    assert lesson.status_code == 201, lesson.text
    path = "/api/v1/admin/lessons/test-lesson/versions/1/transition"
    assert (await api_post(manager, path, {"action": "submit"})).status_code == 200
    assert (await api_post(manager, path, {"action": "approve"})).status_code == 409


async def test_monitoring_reports_the_database(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    data = (await owner.get("/api/v1/admin/monitoring")).json()
    database = next(s for s in data["services"] if s["id"] == "database")
    assert database["status"] == "ok"


async def test_bulk_submit_and_delete_touch_only_drafts(harness):
    author = await staff(harness, "author@qazmind.kz", ["CONTENT_MANAGER"])
    reviewer = await staff(harness, "reviewer@qazmind.kz", ["CONTENT_REVIEWER"])
    base = "/api/v1/admin/questions"
    rows = [imported(f"b-{i}", text_ru=f"Вопрос номер {i} для массовых действий?") for i in range(4)]
    assert (await api_post(author, base + "/import", {"rows": rows})).status_code == 201
    items = (await author.get(base)).json()["items"]
    ids = [q["id"] for q in items]

    # A reviewer has no content.edit: bulk actions are refused.
    assert (await api_post(reviewer, base + "/bulk", {"action": "delete", "ids": ids})).status_code == 403
    # Exactly one scope is required.
    assert (await api_post(author, base + "/bulk", {"action": "delete"})).status_code == 422
    assert (await api_post(author, base + "/bulk", {"action": "delete", "ids": ids, "filter": {}})).status_code == 422

    # Send one question to review by id, the rest by filter ("all found").
    one = await api_post(author, base + "/bulk", {"action": "submit", "ids": ids[:1]})
    assert one.json() == {"done": 1, "skipped": 0}
    rest = await api_post(author, base + "/bulk", {"action": "submit", "filter": {"status": "draft"}})
    assert rest.json() == {"done": 3, "skipped": 0}
    assert (await author.get(base + "?status=in_review")).json()["total"] == 4

    # Questions under review cannot be deleted.
    refused = await api_post(author, base + "/bulk", {"action": "delete", "ids": ids})
    assert refused.json() == {"done": 0, "skipped": 4}
    assert (await author.get(base)).json()["total"] == 4

    # Drafts can: import two more and delete one by id, the other by filter.
    more = [imported("d-1", text_ru="Черновик, который удалят по номеру?"), imported("d-2", text_ru="Черновик, который удалят по фильтру?")]
    assert (await api_post(author, base + "/import", {"rows": more})).status_code == 201
    drafts = (await author.get(base + "?status=draft")).json()["items"]
    assert len(drafts) == 2
    assert (await api_post(author, base + "/bulk", {"action": "delete", "ids": [drafts[0]["id"]]})).json() == {"done": 1, "skipped": 0}
    assert (await api_post(author, base + "/bulk", {"action": "delete", "filter": {"status": "draft"}})).json() == {"done": 1, "skipped": 0}
    assert (await author.get(base)).json()["total"] == 4


async def test_owner_can_approve_and_publish_in_bulk_others_cannot_their_own(harness):
    base = "/api/v1/admin/questions"
    manager = await staff(harness, "manager@qazmind.kz", ["CONTENT_MANAGER", "CONTENT_REVIEWER"])
    rows = [imported(f"o-{i}", text_ru=f"Вопрос {i} для проверки владельца?") for i in range(3)]
    assert (await api_post(manager, base + "/import", {"rows": rows})).status_code == 201
    assert (await api_post(manager, base + "/bulk", {"action": "submit", "filter": {"status": "draft"}})).json()["done"] == 3

    # The author with review rights is skipped on their own questions; nothing changes.
    own = await api_post(manager, base + "/bulk", {"action": "approve", "filter": {"status": "in_review"}})
    assert own.json() == {"done": 0, "skipped": 3}

    owner = await staff(harness, "owner2@qazmind.kz", ["OWNER"])
    approved = await api_post(owner, base + "/bulk", {"action": "approve", "filter": {"status": "in_review"}})
    assert approved.json() == {"done": 3, "skipped": 0}
    published = await api_post(owner, base + "/bulk", {"action": "publish", "filter": {"status": "approved"}})
    assert published.json() == {"done": 3, "skipped": 0}
    assert (await owner.get(base + "?status=published")).json()["total"] == 3

    # The owner may also approve what the owner wrote.
    mine = await api_post(owner, base + "/import", {"rows": [imported("o-own", text_ru="Вопрос владельца для самопроверки?")]})
    assert mine.status_code == 201
    qid = (await owner.get(base + "?status=draft")).json()["items"][0]["id"]
    assert (await api_post(owner, f"{base}/{qid}/transition", {"action": "submit"})).status_code == 200
    assert (await api_post(owner, f"{base}/{qid}/transition", {"action": "approve"})).status_code == 200

    # Returning needs notes; a role without the permission is refused.
    assert (await api_post(owner, base + "/bulk", {"action": "return", "ids": [qid]})).status_code == 422
    author_only = await staff(harness, "writer@qazmind.kz", ["CONTENT_MANAGER"])
    assert (await api_post(author_only, base + "/bulk", {"action": "approve", "ids": [qid]})).status_code == 403
