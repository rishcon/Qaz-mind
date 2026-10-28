"""The platform's view of schools, e-mails about decisions, school administrators and the school overview."""

from sqlalchemy import select

from app.models import AuditEvent
from app.tests.helpers import api_post
from app.tests.test_admin import staff
from app.tests.test_assignments import body as assignment_body
from app.tests.test_assignments import join, world
from app.tests.test_schools import API, APPLICATION, approved_school, person


async def test_decisions_are_mailed_and_counted_as_attention(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    analyst = await staff(harness, "analyst@qazmind.kz", ["CONTENT_MANAGER"])
    applicant = await person(harness, "dir@school.kz", "Директор Школы")
    application = (await api_post(applicant, f"{API}/school-applications", APPLICATION)).json()

    overview = (await owner.get(f"{API}/admin/overview")).json()
    assert {"id": "school_applications", "count": 1} == {k: v for k, v in next(a for a in overview["attention"] if a["id"] == "school_applications").items() if k in ("id", "count")}
    # Staff without the right to read schools do not see the item.
    assert all(a["id"] != "school_applications" for a in (await analyst.get(f"{API}/admin/overview")).json()["attention"])

    rejected = await api_post(owner, f"{API}/admin/school-applications/{application['id']}/reject", {"reason": "Нет подтверждения"})
    assert rejected.json()["email_sent"] is True
    mail = harness.mailer.messages_to("dir@school.kz", "отклонена")[0]
    assert "Нет подтверждения" in mail.text

    second = (await api_post(applicant, f"{API}/school-applications", APPLICATION)).json()
    approved = await api_post(owner, f"{API}/admin/school-applications/{second['id']}/approve")
    assert approved.json()["email_sent"] is True
    assert "/school" in harness.mailer.messages_to("dir@school.kz", "одобрена")[0].text
    overview = (await owner.get(f"{API}/admin/overview")).json()
    assert all(a["id"] != "school_applications" for a in overview["attention"])


async def test_platform_sees_a_school_in_detail_and_can_suspend_it(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    editor = await staff(harness, "editor@qazmind.kz", ["CONTENT_MANAGER"])
    await join(harness, admin, org, code_a, "s1@mail.kz", "Ученик Один")
    made = (await api_post(teacher, f"{API}/organizations/{org}/assignments", assignment_body([class_a["id"]]))).json()

    detail = (await owner.get(f"{API}/admin/organizations/{org}")).json()
    assert detail["organization"]["name"] == "Школа А" and detail["organization"]["status"] == "active"
    assert sorted(p["role"] for p in detail["people"]) == ["SCHOOL_ADMIN", "TEACHER"]
    assert {c["name"]: c["student_count"] for c in detail["classes"]} == {"11 А": 1, "11 Б": 0}
    assert detail["licenses"][0]["seats_used"] == 1 and detail["licenses"][0]["current"] is True
    assert detail["assignments"] == {"draft": 1}
    assert detail["application"]["contact_name"] == "Дана Серикова"
    assert (await owner.get(f"{API}/admin/organizations/00000000-0000-0000-0000-000000000000")).status_code == 404
    assert (await editor.get(f"{API}/admin/organizations/{org}")).status_code == 403

    teachers = (await owner.get(f"{API}/admin/teachers")).json()["items"]
    assert {(t["email"], t["role"]) for t in teachers} == {("a@school.kz", "SCHOOL_ADMIN"), ("teacher@school.kz", "TEACHER")}
    assert next(t for t in teachers if t["role"] == "TEACHER")["class_count"] == 1
    listed = (await owner.get(f"{API}/admin/assignments")).json()["items"]
    assert [(a["id"], a["organization_name"], a["status"]) for a in listed] == [(made["id"], "Школа А", "draft")]
    assert (await editor.get(f"{API}/admin/teachers")).status_code == 403

    # Suspending needs a reason and a permission; it stops changes in the school and is audited.
    assert (await api_post(editor, f"{API}/admin/organizations/{org}/status", {"status": "suspended", "reason": "x" * 10})).status_code == 403
    assert (await api_post(owner, f"{API}/admin/organizations/{org}/status", {"status": "suspended"})).status_code == 422
    assert (await api_post(owner, f"{API}/admin/organizations/{org}/status", {"status": "suspended", "reason": "Нарушение условий"})).status_code == 200
    blocked = await api_post(admin, f"{API}/organizations/{org}/classes", {"name": "12", "academic_year": "2026-2027"})
    assert blocked.status_code == 403 and blocked.json()["error"]["code"] == "ORGANIZATION_NOT_ACTIVE"
    assert (await api_post(owner, f"{API}/admin/organizations/{org}/status", {"status": "active"})).status_code == 200
    assert (await api_post(admin, f"{API}/organizations/{org}/classes", {"name": "12", "academic_year": "2026-2027"})).status_code == 201
    async with harness.session_factory() as db:
        actions = list((await db.execute(select(AuditEvent.action))).scalars())
    assert actions.count("organization.status") == 2


async def test_school_administrators_overview_and_removing_people(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    await join(harness, admin, org, code_a, "s1@mail.kz", "Ученик Один")
    student = await person(harness, "s2@mail.kz", "Ученик Два")
    await api_post(student, f"{API}/classes/join-requests", {"code": code_a})

    overview = (await admin.get(f"{API}/organizations/{org}/overview")).json()
    assert (overview["classes"], overview["students"], overview["teachers"], overview["admins"]) == (2, 1, 1, 1)
    assert overview["pending_join_requests"] == 1 and overview["license"]["seat_limit"] == 10
    # A teacher's overview covers only the assigned class and omits the licence and staff numbers.
    mine = (await teacher.get(f"{API}/organizations/{org}/overview")).json()
    assert mine["classes"] == 1 and mine["license"] is None and mine["pending_join_requests"] == 1
    assert [s["email"] for s in (await admin.get(f"{API}/organizations/{org}/students")).json()] == ["s1@mail.kz"]
    assert (await teacher.get(f"{API}/organizations/{org}/students")).status_code == 403

    # A second administrator comes by invitation; only an administrator may invite one.
    path = f"{API}/organizations/{org}/invitations"
    assert (await api_post(teacher, path, {"email": "deputy@school.kz", "role": "SCHOOL_ADMIN"})).status_code == 403
    assert (await api_post(admin, path, {"email": "deputy@school.kz", "role": "SCHOOL_ADMIN"})).status_code == 201
    deputy = await person(harness, "deputy@school.kz", "Завуч Школы")
    token = harness.mailer.token_for("deputy@school.kz", "приглашение")
    assert (await api_post(deputy, f"{API}/invitations/accept", {"token": token})).json()["role"] == "SCHOOL_ADMIN"
    assert (await deputy.get(f"{API}/organizations/{org}/teachers")).status_code == 200
    assert (await admin.get(f"{API}/organizations/{org}/overview")).json()["admins"] == 2
    assert [a["email"] for a in (await admin.get(f"{API}/organizations/{org}/admins")).json()] == ["a@school.kz", "deputy@school.kz"]
    assert (await teacher.get(f"{API}/organizations/{org}/admins")).status_code == 403

    # Removing people: a teacher loses access with their classes; the last administrator stays.
    teacher_id = (await admin.get(f"{API}/organizations/{org}/teachers")).json()[0]["user_id"]
    assert (await api_post(teacher, f"{API}/organizations/{org}/members/{teacher_id}/revoke")).status_code == 403
    assert (await api_post(admin, f"{API}/organizations/{org}/members/{teacher_id}/revoke")).status_code == 204
    assert (await teacher.get(f"{API}/organizations/{org}/classes")).status_code == 404
    assert (await teacher.get(f"{API}/me/organizations")).json() == []
    admin_id = (await admin.get(f"{API}/auth/me")).json()["user"]["id"]
    deputy_id = (await deputy.get(f"{API}/auth/me")).json()["user"]["id"]
    assert (await api_post(admin, f"{API}/organizations/{org}/members/{deputy_id}/revoke")).status_code == 204
    last = await api_post(admin, f"{API}/organizations/{org}/members/{admin_id}/revoke")
    assert last.status_code == 409 and last.json()["error"]["code"] == "LAST_ADMIN"
    # Another school's administrator cannot touch this school's people.
    other_org, other_admin = await approved_school(harness, owner, "b@school.kz", "Школа Б")
    assert (await api_post(other_admin, f"{API}/organizations/{org}/members/{admin_id}/revoke")).status_code == 404
    assert other_org
