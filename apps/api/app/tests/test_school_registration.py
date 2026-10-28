"""School registration as a school, and logins created by the school for its teachers and students."""

from sqlalchemy import func, select

from app.models import OrganizationApplication, User
from app.tests.helpers import api_post
from app.tests.test_admin import staff
from app.tests.test_school_access import give_license, school_with_class
from app.tests.test_schools import API, APPLICATION, approved_school

REGISTRATION = {
    "name": "Дана Серикова",
    "email": "director@lyceum5.kz",
    "password": "CorrectHorse42",
    **{k: v for k, v in APPLICATION.items()},
}


async def login(harness, identifier: str, password: str):
    client = await harness.new_client()
    response = await api_post(client, f"{API}/auth/login", {"email": identifier, "password": password})
    return client, response


async def test_contact_name_defaults_to_the_representative(harness):
    client = await harness.new_client()
    body = {k: v for k, v in REGISTRATION.items() if k != "contact_name"}
    assert (await api_post(client, f"{API}/auth/register-school", body)).status_code == 202
    async with harness.session_factory() as db:
        assert (await db.execute(select(OrganizationApplication.contact_name))).scalar_one() == "Дана Серикова"


async def test_a_school_registers_as_a_school_not_as_a_student(harness):
    client = await harness.new_client()
    bad = await api_post(client, f"{API}/auth/register-school", {**REGISTRATION, "approx_students": 0})
    assert bad.status_code == 422
    sent = await api_post(client, f"{API}/auth/register-school", REGISTRATION)
    assert sent.status_code == 202

    async with harness.session_factory() as db:
        user = (await db.execute(select(User).where(User.email == "director@lyceum5.kz"))).scalar_one()
        assert user.account_type == "school" and user.email_verified_at is None
        applications = (await db.execute(select(OrganizationApplication))).scalars().all()
        assert [(a.school_name, a.status, a.applicant_user_id) for a in applications] == [("Лицей № 5", "pending", user.id)]

    # The mailbox must be confirmed before the first sign-in; a repeated registration changes nothing.
    assert (await login(harness, "director@lyceum5.kz", "CorrectHorse42"))[1].status_code == 403
    again = await api_post(client, f"{API}/auth/register-school", REGISTRATION)
    assert again.status_code == 202
    async with harness.session_factory() as db:
        assert (await db.scalar(select(func.count()).select_from(OrganizationApplication))) == 1

    token = harness.mailer.token_for("director@lyceum5.kz", "подтвердите email")
    verified = await api_post(client, f"{API}/auth/verify-email", {"token": token})
    assert verified.status_code == 200
    me = verified.json()
    assert me["user"]["account_type"] == "school" and me["onboarding_completed"] is False
    mine = (await client.get(f"{API}/school-applications/mine")).json()
    assert [(a["school_name"], a["status"]) for a in mine] == [("Лицей № 5", "pending")]
    assert (await client.get(f"{API}/me/organizations")).json() == []

    # Platform approval turns the representative into the administrator of the new school.
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    approved = await api_post(owner, f"{API}/admin/school-applications/{mine[0]['id']}/approve")
    assert approved.status_code == 200
    memberships = (await client.get(f"{API}/me/organizations")).json()
    assert [(m["organization"]["name"], m["role"]) for m in memberships] == [("Лицей № 5", "SCHOOL_ADMIN")]


async def test_school_creates_logins_for_teachers_and_students(harness):
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    org, admin, class_a = await school_with_class(harness, owner)
    path = f"{API}/organizations/{org}/accounts"
    class_id = class_a["id"]

    # No licence: a student cannot be created and nothing is left behind.
    refused = await api_post(admin, path, {"role": "STUDENT", "name": "Иванов Пётр", "class_ids": [class_id]})
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "NO_LICENSE"
    async with harness.session_factory() as db:
        assert (await db.scalar(select(func.count()).select_from(User).where(User.account_type == "managed"))) == 0
    await give_license(owner, org, seats=3)

    # A teacher account: login and temporary password, assigned to the class straight away.
    teacher = (await api_post(admin, path, {"role": "TEACHER", "name": "Сергеева Анна", "class_ids": [class_id]})).json()
    assert teacher["username"].startswith("sergeeva.a") and len(teacher["password"]) == 10
    client, signed = await login(harness, teacher["username"].upper(), teacher["password"])
    assert signed.status_code == 200
    me = signed.json()
    assert me["user"]["account_type"] == "school" and me["user"]["must_change_password"] is True
    assert [c["id"] for c in (await client.get(f"{API}/organizations/{org}/classes")).json()] == [class_id]
    assert (await api_post(client, path, {"role": "TEACHER", "name": "Ещё Учитель"})).status_code == 403
    assert (await login(harness, teacher["username"], "wrong-password"))[1].status_code == 401

    # The temporary password must be replaced; the new one works, the old one does not.
    wrong = await api_post(client, f"{API}/auth/password/change", {"current_password": "nope-nope", "new_password": "BrandNewPass77"})
    assert wrong.status_code == 400
    assert (await api_post(client, f"{API}/auth/password/change", {"current_password": teacher["password"], "new_password": teacher["password"]})).status_code == 422
    assert (await api_post(client, f"{API}/auth/password/change", {"current_password": teacher["password"], "new_password": "BrandNewPass77"})).status_code == 204
    assert (await client.get(f"{API}/auth/me")).json()["user"]["must_change_password"] is False
    assert (await login(harness, teacher["username"], teacher["password"]))[1].status_code == 401
    assert (await login(harness, teacher["username"], "BrandNewPass77"))[1].status_code == 200

    # A student: own login, a seat of the licence, a custom login may be chosen, duplicates are refused.
    custom = await api_post(admin, path, {"role": "STUDENT", "name": "Ким Алия", "class_ids": [class_id], "username": "kim.aliya", "password": "Start1234"})
    assert custom.status_code == 201 and custom.json()["username"] == "kim.aliya" and custom.json()["password"] == "Start1234"
    assert (await api_post(admin, path, {"role": "STUDENT", "name": "Другая Ким", "class_ids": [class_id], "username": "KIM.ALIYA"})).json()["error"]["code"] == "USERNAME_TAKEN"
    assert (await api_post(admin, path, {"role": "STUDENT", "name": "Другая Ким", "class_ids": [class_id], "username": "кириллица"})).status_code == 422
    assert (await api_post(admin, path, {"role": "STUDENT", "name": "Без Класса"})).status_code == 422
    student_client, student = await login(harness, "kim.aliya", "Start1234")
    assert student.status_code == 200 and student.json()["user"]["account_type"] == "managed"
    assert [c["class_name"] for c in (await student_client.get(f"{API}/me/school-classes")).json()] == ["11 А"]

    # A list of names creates all accounts at once or none: there are 3 seats and one is used by Ким Алия.
    too_many = await api_post(admin, f"{path}/bulk", {"class_id": class_id, "names": ["Один Ученик", "Два Ученик", "Три Ученик"]})
    assert too_many.status_code == 409 and too_many.json()["error"]["code"] == "NO_SEATS"
    async with harness.session_factory() as db:
        assert (await db.scalar(select(func.count()).select_from(User).where(User.account_type == "managed"))) == 1
    two = (await api_post(admin, f"{path}/bulk", {"class_id": class_id, "names": ["Один Ученик", "  ", "Два  Ученик"]})).json()["items"]
    assert [i["name"] for i in two] == ["Один Ученик", "Два Ученик"] and len({i["username"] for i in two}) == 2
    for item in two:
        assert (await login(harness, item["username"], item["password"]))[1].status_code == 200
    assert (await api_post(admin, f"{path}/bulk", {"class_id": class_id, "names": []})).status_code == 422

    # Resetting a password: only the school's own accounts, only by its administrator, and the old sessions end.
    reset = await api_post(admin, f"{path}/{custom.json()['user_id']}/reset-password")
    assert reset.status_code == 200 and reset.json()["password"] != "Start1234"
    assert (await login(harness, "kim.aliya", "Start1234"))[1].status_code == 401
    assert (await student_client.get(f"{API}/auth/me")).status_code == 401
    again, relogin = await login(harness, "kim.aliya", reset.json()["password"])
    assert relogin.json()["user"]["must_change_password"] is True
    other_org, other_admin = await approved_school(harness, owner, "b@school.kz", "Школа Б")
    assert (await api_post(other_admin, f"{API}/organizations/{org}/accounts/{custom.json()['user_id']}/reset-password")).status_code == 404
    assert (await api_post(other_admin, f"{API}/organizations/{other_org}/accounts/{custom.json()['user_id']}/reset-password")).status_code == 404
    assert (await api_post(client, f"{path}/{custom.json()['user_id']}/reset-password")).status_code == 403
    assert again

    # An account without a mailbox cannot ask for a reset link: nothing is sent.
    before = len(harness.mailer.sent)
    await api_post(await harness.new_client(), f"{API}/auth/password/forgot", {"email": f"{teacher['username']}@managed.invalid"})
    assert len(harness.mailer.sent) == before
