"""Invitations, class codes, join requests and seat licensing."""

import asyncio
import uuid
from datetime import timedelta

from sqlalchemy import select, text

from app.core.time import utcnow
from app.models import ClassMember, OrganizationMember
from app.tests.helpers import api_post
from app.tests.test_admin import staff
from app.tests.test_schools import API, approved_school, person, user_id

YEAR = {"academic_year": "2026-2027"}


async def school_with_class(harness, owner, email="a@school.kz", name="Школа А"):
    org, admin = await approved_school(harness, owner, email, name)
    school_class = (await api_post(admin, f"{API}/organizations/{org}/classes", {"name": "11 А", **YEAR})).json()
    return org, admin, school_class


async def give_license(owner, org: str, seats: int, starts_days=-1, days=365):
    now = utcnow()
    response = await api_post(
        owner,
        f"{API}/admin/organizations/{org}/licenses",
        {
            "plan": "pilot",
            "seat_limit": seats,
            "starts_at": (now + timedelta(days=starts_days)).isoformat(),
            "expires_at": (now + timedelta(days=days)).isoformat(),
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


async def make_code(admin, org: str, class_id: str, **body) -> dict:
    response = await api_post(admin, f"{API}/organizations/{org}/classes/{class_id}/join-codes", body)
    assert response.status_code == 201, response.text
    return response.json()


async def add_teacher(harness, admin, org: str, class_id: str, email: str):
    """Invite a teacher by e-mail and accept in the teacher's own account; returns that client."""
    teacher = await person(harness, email, "Учитель Истории")
    sent = await api_post(admin, f"{API}/organizations/{org}/invitations", {"email": email, "role": "TEACHER", "class_id": class_id})
    assert sent.status_code == 201, sent.text
    token = harness.mailer.token_for(email, "приглашение")
    accepted = await api_post(teacher, f"{API}/invitations/accept", {"token": token})
    assert accepted.status_code == 200, accepted.text
    return teacher


async def test_teacher_invitation_lifecycle(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org, admin, school_class = await school_with_class(harness, owner)
    other_org, other_admin = await approved_school(harness, owner, "b@school.kz", "Школа Б")

    path = f"{API}/organizations/{org}/invitations"
    bad = await api_post(admin, path, {"email": "not-an-email", "role": "TEACHER"})
    assert bad.status_code == 422
    sent = await api_post(admin, path, {"email": "Teacher@School.kz", "role": "TEACHER", "class_id": school_class["id"]})
    assert sent.status_code == 201 and sent.json()["email"] == "teacher@school.kz" and sent.json()["status"] == "pending"
    invitation_id = sent.json()["id"]
    assert (await api_post(admin, path, {"email": "teacher@school.kz", "role": "TEACHER", "class_id": school_class["id"]})).status_code == 409
    token = harness.mailer.token_for("teacher@school.kz", "приглашение")

    # School B cannot see, revoke or resend the invitation of school A.
    assert (await other_admin.get(path)).status_code == 404
    assert (await api_post(other_admin, f"{path}/{invitation_id}/revoke")).status_code == 404
    assert (await api_post(other_admin, f"{API}/organizations/{other_org}/invitations/{invitation_id}/revoke")).status_code == 404

    # Only the person with the invited address may accept, and only in their own signed-in account.
    anonymous = await harness.new_client()
    assert (await api_post(anonymous, f"{API}/invitations/accept", {"token": token})).status_code == 401
    wrong = await person(harness, "someone@else.kz", "Другой Человек")
    mismatch = await api_post(wrong, f"{API}/invitations/accept", {"token": token})
    assert mismatch.status_code == 403 and mismatch.json()["error"]["code"] == "INVITATION_EMAIL_MISMATCH"
    assert (await api_post(wrong, f"{API}/invitations/accept", {"token": "x" * 43})).json()["error"]["code"] == "INVITATION_INVALID"

    # Resending replaces the link: the old one stops working.
    assert (await api_post(admin, f"{path}/{invitation_id}/resend")).status_code == 200
    newest = harness.mailer.token_for("teacher@school.kz", "приглашение")
    assert newest != token
    teacher = await person(harness, "teacher@school.kz", "Учитель Истории")
    assert (await api_post(teacher, f"{API}/invitations/accept", {"token": token})).status_code == 404
    accepted = await api_post(teacher, f"{API}/invitations/accept", {"token": newest})
    assert accepted.status_code == 200
    assert accepted.json()["role"] == "TEACHER" and accepted.json()["class_id"] == school_class["id"]

    memberships = (await teacher.get(f"{API}/me/organizations")).json()
    assert [(m["organization"]["name"], m["role"]) for m in memberships] == [("Школа А", "TEACHER")]
    assert [c["id"] for c in (await teacher.get(f"{API}/organizations/{org}/classes")).json()] == [school_class["id"]]
    again = await api_post(teacher, f"{API}/invitations/accept", {"token": newest})
    assert again.status_code == 410 and again.json()["error"]["code"] == "INVITATION_USED"

    # Revoked and expired invitations do not work even with the saved link.
    await api_post(admin, path, {"email": "later@school.kz", "role": "TEACHER"})
    later = (await admin.get(path)).json()
    revoked_id = next(i["id"] for i in later if i["email"] == "later@school.kz")
    revoked_token = harness.mailer.token_for("later@school.kz", "приглашение")
    assert (await api_post(admin, f"{path}/{revoked_id}/revoke")).json()["status"] == "revoked"
    later_user = await person(harness, "later@school.kz", "Поздний Учитель")
    assert (await api_post(later_user, f"{API}/invitations/accept", {"token": revoked_token})).json()["error"]["code"] == "INVITATION_REVOKED"

    await api_post(admin, path, {"email": "old@school.kz", "role": "TEACHER"})
    old_token = harness.mailer.token_for("old@school.kz", "приглашение")
    async with harness.session_factory() as db:
        await db.execute(text("UPDATE invitations SET expires_at = now() - interval '1 hour' WHERE email = 'old@school.kz'"))
        await db.commit()
    old_user = await person(harness, "old@school.kz", "Старый Учитель")
    assert (await api_post(old_user, f"{API}/invitations/accept", {"token": old_token})).json()["error"]["code"] == "INVITATION_EXPIRED"

    # A teacher cannot invite other teachers; a student invitation needs a class of that teacher.
    assert (await api_post(teacher, path, {"email": "x@school.kz", "role": "TEACHER"})).status_code == 403
    assert (await api_post(teacher, path, {"email": "s@school.kz", "role": "STUDENT"})).status_code == 422


async def test_class_code_requests_need_a_licence_and_seats_are_limited(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    finance_less = await staff(harness, "editor@qazmind.kz", ["CONTENT_MANAGER"])
    org, admin, school_class = await school_with_class(harness, owner)
    class_id = school_class["id"]
    other_org, other_admin, other_class = await school_with_class(harness, owner, "b@school.kz", "Школа Б")

    issued = await make_code(admin, org, class_id, valid_days=7, max_uses=5)
    code = issued["code"]
    assert len(code) == 9 and issued["code_hint"] == code[-2:]
    # Only a hint is listed afterwards, never the full code.
    listed = (await admin.get(f"{API}/organizations/{org}/classes/{class_id}/join-codes")).json()
    assert listed[0]["code"] is None
    assert (await other_admin.get(f"{API}/organizations/{org}/classes/{class_id}/join-codes")).status_code == 404

    alice = await person(harness, "alice@mail.kz", "Алиса Ученица")
    bob = await person(harness, "bob@mail.kz", "Боб Ученик")
    bad = await api_post(alice, f"{API}/classes/join-requests", {"code": "ZZZZ-ZZZZ"})
    assert bad.status_code == 404 and bad.json()["error"]["code"] == "CODE_INVALID"
    anonymous = await harness.new_client()
    assert (await api_post(anonymous, f"{API}/classes/join-requests", {"code": code})).status_code == 401

    # The code is accepted in any case and with or without the dash; the request waits for a decision.
    request = await api_post(alice, f"{API}/classes/join-requests", {"code": code.lower().replace("-", "")})
    assert request.status_code == 201 and request.json()["status"] == "pending"
    assert (await api_post(alice, f"{API}/classes/join-requests", {"code": code})).json()["error"]["code"] == "REQUEST_PENDING"
    bob_request = (await api_post(bob, f"{API}/classes/join-requests", {"code": code})).json()
    waiting = (await admin.get(f"{API}/organizations/{org}/classes/{class_id}/join-requests")).json()
    assert {r["email"] for r in waiting} == {"alice@mail.kz", "bob@mail.kz"}
    assert (await other_admin.get(f"{API}/organizations/{org}/classes/{class_id}/join-requests")).status_code == 404

    decide = lambda rid, action: f"{API}/classes/join-requests/{rid}/{action}"  # noqa: E731
    # A student, a stranger and another school's administrator cannot decide.
    assert (await api_post(bob, decide(request.json()["id"], "approve"))).status_code == 404
    assert (await api_post(other_admin, decide(request.json()["id"], "approve"))).status_code == 404

    # No licence yet: approval is refused and nothing changes.
    refused = await api_post(admin, decide(request.json()["id"], "approve"))
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "NO_LICENSE"
    assert (await alice.get(f"{API}/me/school-classes")).json() == []

    assert (await api_post(finance_less, f"{API}/admin/organizations/{org}/licenses", {"plan": "p", "seat_limit": 1, "starts_at": "2026-01-01T00:00:00Z", "expires_at": "2027-01-01T00:00:00Z"})).status_code == 403
    await give_license(owner, org, seats=1)
    assert (await api_post(admin, decide(request.json()["id"], "approve"))).status_code == 200
    classes = (await alice.get(f"{API}/me/school-classes")).json()
    assert [(c["class_name"], c["organization_name"]) for c in classes] == [("11 А", "Школа А")]
    full = await api_post(admin, decide(bob_request["id"], "approve"))
    assert full.status_code == 409 and full.json()["error"]["code"] == "NO_SEATS"
    licence = (await admin.get(f"{API}/organizations/{org}/licenses")).json()[0]
    assert licence["seats_used"] == 1 and licence["seat_limit"] == 1 and licence["current"] is True
    assert (await admin.get(f"{API}/organizations/{other_org}/licenses")).status_code == 404

    # Removing a student frees the seat; their personal account is untouched.
    alice_id = str(await user_id(harness, "alice@mail.kz"))
    students = (await admin.get(f"{API}/organizations/{org}/classes/{class_id}/students")).json()
    assert [s["email"] for s in students] == ["alice@mail.kz"]
    assert (await api_post(admin, f"{API}/organizations/{org}/classes/{class_id}/students/{alice_id}/remove")).status_code == 204
    assert (await alice.get(f"{API}/me/school-classes")).json() == []
    assert (await alice.get(f"{API}/auth/me")).status_code == 200
    assert (await api_post(admin, decide(bob_request["id"], "approve"))).status_code == 200
    assert (await api_post(admin, decide(bob_request["id"], "approve"))).status_code == 409

    # Rejection, a revoked code and an exhausted code.
    carol = await person(harness, "carol@mail.kz", "Карина Ученица")
    carol_request = (await api_post(carol, f"{API}/classes/join-requests", {"code": code})).json()
    assert (await api_post(admin, decide(carol_request["id"], "reject"))).json()["status"] == "rejected"
    assert (await api_post(admin, f"{API}/organizations/{org}/classes/{class_id}/join-codes/{issued['id']}/revoke")).json()["revoked"] is True
    dave = await person(harness, "dave@mail.kz", "Дамир Ученик")
    assert (await api_post(dave, f"{API}/classes/join-requests", {"code": code})).json()["error"]["code"] == "CODE_INVALID"
    one_use = await make_code(admin, org, class_id, max_uses=1)
    assert (await api_post(dave, f"{API}/classes/join-requests", {"code": one_use["code"]})).status_code == 201
    erin = await person(harness, "erin@mail.kz", "Эрин Ученица")
    assert (await api_post(erin, f"{API}/classes/join-requests", {"code": one_use["code"]})).json()["error"]["code"] == "CODE_INVALID"
    expired = await make_code(admin, org, class_id)
    async with harness.session_factory() as db:
        await db.execute(text("UPDATE join_codes SET expires_at = now() - interval '1 minute' WHERE id = :id"), {"id": expired["id"]})
        await db.commit()
    assert (await api_post(erin, f"{API}/classes/join-requests", {"code": expired["code"]})).json()["error"]["code"] == "CODE_INVALID"


async def test_parallel_approvals_cannot_exceed_the_seat_limit(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org, admin, school_class = await school_with_class(harness, owner)
    await give_license(owner, org, seats=1)
    code = (await make_code(admin, org, school_class["id"]))["code"]
    ids = []
    for n in range(4):
        student = await person(harness, f"s{n}@mail.kz", f"Ученик {n}")
        ids.append((await api_post(student, f"{API}/classes/join-requests", {"code": code})).json()["id"])
    results = await asyncio.gather(*[api_post(admin, f"{API}/classes/join-requests/{rid}/approve") for rid in ids])
    assert sorted(r.status_code for r in results) == [200, 409, 409, 409]
    students = (await admin.get(f"{API}/organizations/{org}/classes/{school_class['id']}/students")).json()
    assert len(students) == 1


async def test_teachers_work_only_with_their_own_classes_and_student_invitations_use_seats(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org, admin, class_a = await school_with_class(harness, owner)
    class_b = (await api_post(admin, f"{API}/organizations/{org}/classes", {"name": "11 Б", **YEAR})).json()
    await give_license(owner, org, seats=2)
    teacher = await add_teacher(harness, admin, org, class_a["id"], "teacher@school.kz")

    # The teacher manages codes, requests and student invitations of the assigned class only.
    assert (await api_post(teacher, f"{API}/organizations/{org}/classes/{class_b['id']}/join-codes", {})).status_code == 404
    code = await make_code(teacher, org, class_a["id"])
    student = await person(harness, "kid@mail.kz", "Ученик Один")
    request = (await api_post(student, f"{API}/classes/join-requests", {"code": code["code"]})).json()
    assert (await api_post(teacher, f"{API}/classes/join-requests/{request['id']}/approve")).status_code == 200
    assert [s["email"] for s in (await teacher.get(f"{API}/organizations/{org}/classes/{class_a['id']}/students")).json()] == ["kid@mail.kz"]
    assert (await teacher.get(f"{API}/organizations/{org}/classes/{class_b['id']}/students")).status_code == 404

    path = f"{API}/organizations/{org}/invitations"
    assert (await api_post(teacher, path, {"email": "kid2@mail.kz", "role": "STUDENT", "class_id": class_b["id"]})).status_code == 404
    assert (await api_post(teacher, path, {"email": "kid2@mail.kz", "role": "STUDENT", "class_id": class_a["id"]})).status_code == 201
    kid2 = await person(harness, "kid2@mail.kz", "Ученик Два")
    token = harness.mailer.token_for("kid2@mail.kz", "приглашение")
    assert (await api_post(kid2, f"{API}/invitations/accept", {"token": token})).status_code == 200
    licence = (await admin.get(f"{API}/organizations/{org}/licenses")).json()[0]
    assert licence["seats_used"] == 2

    # The licence is full: a third invited student is refused and the invitation stays usable later.
    assert (await api_post(admin, path, {"email": "kid3@mail.kz", "role": "STUDENT", "class_id": class_a["id"]})).status_code == 201
    kid3 = await person(harness, "kid3@mail.kz", "Ученик Три")
    token3 = harness.mailer.token_for("kid3@mail.kz", "приглашение")
    assert (await api_post(kid3, f"{API}/invitations/accept", {"token": token3})).json()["error"]["code"] == "NO_SEATS"
    async with harness.session_factory() as db:
        status = (await db.execute(text("SELECT status FROM invitations WHERE email = 'kid3@mail.kz'"))).scalar_one()
        assert status == "pending"
        members = (await db.execute(select(ClassMember).where(ClassMember.role == "student"))).scalars().all()
        assert len(members) == 2
        teachers = (await db.execute(select(OrganizationMember).where(OrganizationMember.role == "TEACHER"))).scalars().all()
        assert len(teachers) == 1 and teachers[0].user_id != uuid.UUID(int=0)


async def test_expired_or_future_licence_gives_no_seats(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org, admin, school_class = await school_with_class(harness, owner)
    await give_license(owner, org, seats=5, starts_days=-30, days=-1)  # ended yesterday
    await give_license(owner, org, seats=5, starts_days=10, days=40)  # starts later
    code = (await make_code(admin, org, school_class["id"]))["code"]
    student = await person(harness, "kid@mail.kz", "Ученик Один")
    request = (await api_post(student, f"{API}/classes/join-requests", {"code": code})).json()
    refused = await api_post(admin, f"{API}/classes/join-requests/{request['id']}/approve")
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "NO_LICENSE"
    licences = (await admin.get(f"{API}/organizations/{org}/licenses")).json()
    assert [item["current"] for item in licences] == [False, False]
    # Cancelling is audited and a cancelled licence is never current.
    current = await give_license(owner, org, seats=5)
    assert (await api_post(owner, f"{API}/admin/organizations/{org}/licenses/{current['id']}/cancel")).json()["status"] == "cancelled"
    assert (await api_post(admin, f"{API}/classes/join-requests/{request['id']}/approve")).json()["error"]["code"] == "NO_LICENSE"
