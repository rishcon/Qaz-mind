"""School applications, moderation, organizations, classes and tenant isolation."""

import uuid

from httpx import AsyncClient
from sqlalchemy import select, text

from app.models import AuditEvent, OrganizationMember, User
from app.tests.helpers import api_patch, api_post, register_and_verify
from app.tests.test_admin import staff

API = "/api/v1"
APPLICATION = {
    "school_name": "Лицей № 5",
    "type": "lyceum",
    "city": "Астана",
    "contact_name": "Дана Серикова",
    "contact_position": "Завуч",
    "contact_phone": "+7 701 000 00 00",
    "approx_students": 320,
}


async def person(harness, email: str, name: str):
    """A verified student account with its own client."""
    client = await harness.new_client()
    registered = await api_post(client, f"{API}/auth/register", {"name": name, "email": email, "password": "CorrectHorse42"})
    assert registered.status_code == 202
    token = harness.mailer.token_for(email, "подтвердите email")
    assert (await api_post(client, f"{API}/auth/verify-email", {"token": token})).status_code == 200
    return client


async def user_id(harness, email: str) -> uuid.UUID:
    async with harness.session_factory() as db:
        return (await db.execute(select(User.id).where(User.email == email))).scalar_one()


async def approved_school(harness, owner, email: str, name: str = "Лицей № 5") -> tuple[str, AsyncClient]:
    """A person applies, the platform owner approves; returns the organization id and the new school administrator."""
    applicant = await person(harness, email, "Директор Школы")
    application = (await api_post(applicant, f"{API}/school-applications", {**APPLICATION, "school_name": name})).json()
    approved = await api_post(owner, f"{API}/admin/school-applications/{application['id']}/approve")
    assert approved.status_code == 200, approved.text
    return approved.json()["organization_id"], applicant


async def test_application_needs_a_session_and_cannot_be_duplicated(harness):
    assert (await api_post(harness.http, f"{API}/school-applications", APPLICATION)).status_code == 401

    await register_and_verify(harness)
    bad = await api_post(harness.http, f"{API}/school-applications", {**APPLICATION, "approx_students": 0})
    assert bad.status_code == 422

    sent = await api_post(harness.http, f"{API}/school-applications", APPLICATION)
    assert sent.status_code == 201
    assert sent.json()["status"] == "pending" and sent.json()["organization_id"] is None
    # The application does not activate anything by itself.
    assert (await harness.http.get(f"{API}/me/organizations")).json() == []
    again = await api_post(harness.http, f"{API}/school-applications", APPLICATION)
    assert again.status_code == 409 and again.json()["error"]["code"] == "APPLICATION_PENDING"
    assert len((await harness.http.get(f"{API}/school-applications/mine")).json()) == 1


async def test_only_staff_with_the_permission_decide_applications_and_every_decision_is_audited(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    editor = await staff(harness, "editor@qazmind.kz", ["CONTENT_MANAGER"])
    applicant = await person(harness, "dir@school.kz", "Директор Школы")
    application = (await api_post(applicant, f"{API}/school-applications", APPLICATION)).json()
    decide = f"{API}/admin/school-applications/{application['id']}"

    # A student session and a staff member without schools.approve cannot decide.
    assert (await api_post(applicant, decide + "/approve")).status_code == 401
    assert (await api_post(editor, decide + "/approve")).status_code == 403
    assert (await editor.get(f"{API}/admin/school-applications")).status_code == 403

    queue = (await owner.get(f"{API}/admin/school-applications?status=pending")).json()["items"]
    assert [i["id"] for i in queue] == [application["id"]] and queue[0]["applicant"]["email"] == "dir@school.kz"

    short = await api_post(owner, decide + "/reject", {"reason": "нет"})
    assert short.status_code == 422
    rejected = await api_post(owner, decide + "/reject", {"reason": "Не удалось подтвердить учреждение"})
    assert rejected.status_code == 200
    assert (await api_post(owner, decide + "/approve")).status_code == 409
    mine = (await applicant.get(f"{API}/school-applications/mine")).json()[0]
    assert mine["status"] == "rejected" and "подтвердить" in mine["rejection_reason"]
    assert (await applicant.get(f"{API}/me/organizations")).json() == []

    # After a rejection the person may apply again, and approval makes them the school administrator.
    second = (await api_post(applicant, f"{API}/school-applications", APPLICATION)).json()
    approved = await api_post(owner, f"{API}/admin/school-applications/{second['id']}/approve")
    assert approved.status_code == 200
    memberships = (await applicant.get(f"{API}/me/organizations")).json()
    assert [(m["organization"]["name"], m["role"], m["organization"]["status"]) for m in memberships] == [
        ("Лицей № 5", "SCHOOL_ADMIN", "active")
    ]
    listed = (await owner.get(f"{API}/admin/organizations")).json()["items"]
    assert [o["name"] for o in listed] == ["Лицей № 5"]

    async with harness.session_factory() as db:
        actions = set((await db.execute(select(AuditEvent.action))).scalars())
    assert {"school_application.reject", "school_application.approve"} <= actions


async def test_school_admin_manages_classes_and_other_schools_see_nothing(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org_a, admin_a = await approved_school(harness, owner, "a@school.kz", "Школа А")
    org_b, admin_b = await approved_school(harness, owner, "b@school.kz", "Школа Б")

    created = await api_post(admin_a, f"{API}/organizations/{org_a}/classes", {"name": "11  А", "academic_year": "2026-2027", "grade": 11})
    assert created.status_code == 201, created.text
    class_a = created.json()
    assert class_a["name"] == "11 А" and class_a["student_count"] == 0
    # The same class, differently typed, is a duplicate; another year is fine.
    dup = await api_post(admin_a, f"{API}/organizations/{org_a}/classes", {"name": "11 а", "academic_year": "2026-2027"})
    assert dup.status_code == 409 and dup.json()["error"]["code"] == "CLASS_EXISTS"
    assert (await api_post(admin_a, f"{API}/organizations/{org_a}/classes", {"name": "11 А", "academic_year": "2027-2028"})).status_code == 201
    assert (await api_post(admin_a, f"{API}/organizations/{org_a}/classes", {"name": "10", "academic_year": "2026-2028"})).status_code == 422

    renamed = await api_patch(admin_a, f"{API}/organizations/{org_a}/classes/{class_a['id']}", {"name": "11 Б"})
    assert renamed.json()["name"] == "11 Б"

    # Tenant isolation: school B cannot read or change anything of school A, and learns nothing about it.
    for path in (f"/organizations/{org_a}", f"/organizations/{org_a}/classes", f"/organizations/{org_a}/teachers"):
        assert (await admin_b.get(API + path)).status_code == 404
    assert (await admin_b.get(f"{API}/organizations/{org_a}/classes/{class_a['id']}")).status_code == 404
    assert (await api_patch(admin_b, f"{API}/organizations/{org_a}/classes/{class_a['id']}", {"status": "archived"})).status_code == 404
    assert (await api_post(admin_b, f"{API}/organizations/{org_a}/classes", {"name": "X", "academic_year": "2026-2027"})).status_code == 404
    # A class of school A cannot be reached through school B's own path either.
    assert (await admin_b.get(f"{API}/organizations/{org_b}/classes/{class_a['id']}")).status_code == 404
    assert (await admin_b.get(f"{API}/organizations/{org_b}/classes")).json() == []
    assert (await admin_b.get(f"{API}/organizations/{uuid.uuid4()}")).status_code == 404

    # A person with no school, and an anonymous caller, are refused.
    stranger = await person(harness, "stranger@mail.kz", "Посторонний")
    assert (await stranger.get(f"{API}/organizations/{org_a}/classes")).status_code == 404
    assert (await stranger.get(f"{API}/me/organizations")).json() == []
    anonymous = await harness.new_client()
    assert (await anonymous.get(f"{API}/organizations/{org_a}/classes")).status_code == 401


async def test_teachers_see_only_assigned_classes_and_cannot_manage(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org_a, admin_a = await approved_school(harness, owner, "a@school.kz", "Школа А")
    org_b, admin_b = await approved_school(harness, owner, "b@school.kz", "Школа Б")
    year = {"academic_year": "2026-2027"}
    c1 = (await api_post(admin_a, f"{API}/organizations/{org_a}/classes", {"name": "11 А", **year})).json()
    c2 = (await api_post(admin_a, f"{API}/organizations/{org_a}/classes", {"name": "11 Б", **year})).json()
    foreign = (await api_post(admin_b, f"{API}/organizations/{org_b}/classes", {"name": "11 А", **year})).json()

    teacher = await person(harness, "teacher@school.kz", "Учитель Истории")
    # Teacher membership normally comes from an invitation (the next stage); here it is inserted directly.
    async with harness.session_factory() as db:
        db.add(OrganizationMember(organization_id=uuid.UUID(org_a), user_id=await user_id(harness, "teacher@school.kz"), role="TEACHER"))
        await db.commit()
    teacher_id = str(await user_id(harness, "teacher@school.kz"))

    assert (await teacher.get(f"{API}/organizations/{org_a}/classes")).json() == []
    assert (await teacher.get(f"{API}/organizations/{org_a}/classes/{c1['id']}")).status_code == 404

    assign = f"{API}/organizations/{org_a}/teachers/{teacher_id}/classes"
    # Only a school administrator assigns classes, and only classes of the same school.
    assert (await api_post(teacher, assign, {"class_ids": [c1["id"]]})).status_code == 403
    assert (await api_post(admin_b, assign, {"class_ids": [c1["id"]]})).status_code == 404
    assert (await api_post(admin_a, assign, {"class_ids": [foreign["id"]]})).status_code == 404
    assert (await api_post(admin_a, f"{API}/organizations/{org_a}/teachers/{uuid.uuid4()}/classes", {"class_ids": []})).status_code == 404

    done = await api_post(admin_a, assign, {"class_ids": [c1["id"]]})
    assert done.status_code == 200
    assert done.json()[0]["email"] == "teacher@school.kz" and done.json()[0]["class_ids"] == [c1["id"]]
    assert [c["id"] for c in (await teacher.get(f"{API}/organizations/{org_a}/classes")).json()] == [c1["id"]]
    assert (await teacher.get(f"{API}/organizations/{org_a}/classes/{c1['id']}")).json()["teacher_count"] == 1
    assert (await teacher.get(f"{API}/organizations/{org_a}/classes/{c2['id']}")).status_code == 404

    # A teacher can neither create, rename nor list teachers.
    assert (await api_post(teacher, f"{API}/organizations/{org_a}/classes", {"name": "Z", **year})).status_code == 403
    assert (await api_patch(teacher, f"{API}/organizations/{org_a}/classes/{c1['id']}", {"name": "Z"})).status_code == 403
    assert (await teacher.get(f"{API}/organizations/{org_a}/teachers")).status_code == 403

    # The assignment is replaced as a whole.
    await api_post(admin_a, assign, {"class_ids": [c2["id"]]})
    assert [c["id"] for c in (await teacher.get(f"{API}/organizations/{org_a}/classes")).json()] == [c2["id"]]
    await api_post(admin_a, assign, {"class_ids": []})
    assert (await teacher.get(f"{API}/organizations/{org_a}/classes")).json() == []


async def test_suspended_organization_cannot_be_changed(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org, admin = await approved_school(harness, owner, "a@school.kz")
    async with harness.session_factory() as db:
        await db.execute(text("UPDATE organizations SET status = 'suspended'"))
        await db.commit()
    blocked = await api_post(admin, f"{API}/organizations/{org}/classes", {"name": "11 А", "academic_year": "2026-2027"})
    assert blocked.status_code == 403 and blocked.json()["error"]["code"] == "ORGANIZATION_NOT_ACTIVE"
    assert (await admin.get(f"{API}/organizations/{org}")).json()["organization"]["status"] == "suspended"
