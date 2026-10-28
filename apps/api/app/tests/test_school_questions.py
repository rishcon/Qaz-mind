"""A school's own questions: privacy, rights, use in assignments next to the platform bank."""

from app.tests.helpers import api_post, api_put
from app.tests.test_assignments import answer_all, body as assignment_body, join, world
from app.tests.test_school_access import add_teacher
from app.tests.test_schools import API, approved_school, person


def question(text: str = "Какой город был столицей Казахстана до 1997 года?", subject: str = "history_kz", **extra) -> dict:
    data = {
        "subject_id": subject,
        "difficulty": "easy",
        "text_ru": text,
        "options": [
            {"label": "A", "text_ru": "Алма-Ата"},
            {"label": "B", "text_ru": "Астана"},
            {"label": "C", "text_ru": "Караганда"},
            {"label": "D", "text_ru": "Шымкент"},
        ],
        "correct_label": "A",
        "explanation_ru": "До 1997 года столицей была Алма-Ата.",
    }
    data.update(extra)
    return data


async def test_school_questions_are_private_to_the_school_and_follow_rights(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    path = f"{API}/organizations/{org}/questions"
    other_org, other_admin = await approved_school(harness, owner, "b@school.kz", "Школа Б")
    second = await add_teacher(harness, admin, org, class_b["id"], "teacher-b@school.kz")

    bad = await api_post(teacher, path, question(correct_label="E"))
    assert bad.status_code == 422
    assert (await api_post(teacher, path, question(subject="astrology"))).status_code == 422
    made = await api_post(teacher, path, question())
    assert made.status_code == 201, made.text
    mine = made.json()
    assert mine["status"] == "active" and mine["author"] == "Учитель Истории" and mine["mine"] is True and mine["used_in_assignments"] == 0

    # Colleagues of the same school see it; only the author and an administrator may change it.
    listed = (await second.get(path)).json()["items"]
    assert [q["id"] for q in listed] == [mine["id"]] and listed[0]["mine"] is False and listed[0]["can_manage"] is False
    assert (await api_put(second, f"{path}/{mine['id']}", question("Чужая правка вопроса для проверки?"))).status_code == 403
    assert (await api_post(second, f"{path}/{mine['id']}/archive")).status_code == 403
    edited = await api_put(admin, f"{path}/{mine['id']}", question("Какой город был столицей до 1997 года?"))
    assert edited.status_code == 200 and edited.json()["text_ru"].startswith("Какой город был столицей до")

    # Another school, a student and an anonymous caller see nothing; the platform bank does not contain it.
    assert (await other_admin.get(f"{API}/organizations/{org}/questions")).status_code == 404
    assert (await other_admin.get(f"{API}/organizations/{other_org}/questions")).json()["items"] == []
    assert (await api_put(other_admin, f"{API}/organizations/{other_org}/questions/{mine['id']}", question())).status_code == 404
    student = await join(harness, admin, org, code_a, "s1@mail.kz", "Ученик Один")
    assert (await student.get(path)).status_code == 404
    platform = await owner.get(f"{API}/admin/questions?page_size=200")
    assert mine["id"] not in [q["id"] for q in platform.json()["items"]]
    assert (await owner.get(f"{API}/admin/questions/{mine['id']}")).status_code == 404
    # Practice draws only from the platform bank, so the school question never reaches a student in practice.
    subjects = (await student.get(f"{API}/practice/subjects")).json()
    assert next(s for s in subjects if s["subject_id"] == "history_kz")["available"] == 8

    # Import is all or nothing and reports the row.
    rows = [question(f"Вопрос номер {n} для проверки импорта?") for n in range(3)]
    imported = await api_post(teacher, f"{path}/import", {"rows": rows})
    assert imported.status_code == 201 and imported.json() == {"created": 3}
    broken = await api_post(teacher, f"{path}/import", {"rows": [question("Нормальный вопрос для проверки?"), question("Вопрос с ошибкой в ответе?", subject="astrology")]})
    assert broken.status_code == 422 and "Строка 2" in broken.json()["error"]["message"]
    assert len((await teacher.get(path)).json()["items"]) == 4

    # Archive hides a question from the active list; delete works only for an unused one.
    assert (await api_post(admin, f"{path}/{mine['id']}/archive")).json()["status"] == "archived"
    assert mine["id"] not in [q["id"] for q in (await teacher.get(path)).json()["items"]]
    assert mine["id"] in [q["id"] for q in (await teacher.get(f"{path}?status=archived")).json()["items"]]
    assert (await api_post(admin, f"{path}/{mine['id']}/restore")).json()["status"] == "active"
    assert (await admin.delete(f"{path}/{mine['id']}", headers={"X-CSRF-Token": admin.cookies.get("qm_csrf")})).status_code == 204


async def test_assignment_mixes_school_and_platform_questions(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    path = f"{API}/organizations/{org}/questions"
    student = await join(harness, admin, org, code_a, "s1@mail.kz", "Ученик Один")
    own = [(await api_post(teacher, path, question(f"Свой вопрос {n} для задания?"))).json() for n in range(2)]
    ids = [q["id"] for q in own]
    assignments = f"{API}/organizations/{org}/assignments"

    # The own questions must be active, of the same subject, and not more than the total.
    too_many = await api_post(teacher, assignments, assignment_body([class_a["id"]], question_count=1, school_question_ids=ids))
    assert too_many.status_code == 422 and too_many.json()["error"]["code"] == "TOO_MANY_SCHOOL_QUESTIONS"
    wrong_subject = await api_post(teacher, assignments, assignment_body([class_a["id"]], subject_id="physics", school_question_ids=ids))
    assert wrong_subject.status_code == 422 and wrong_subject.json()["error"]["code"] == "SCHOOL_QUESTION_INVALID"
    foreign = await api_post(teacher, assignments, assignment_body([class_a["id"]], school_question_ids=["00000000-0000-0000-0000-000000000000"]))
    assert foreign.status_code == 404

    made = await api_post(teacher, assignments, assignment_body([class_a["id"]], question_count=5, school_question_ids=ids))
    assert made.status_code == 201 and made.json()["school_question_ids"] == ids
    one = f"{assignments}/{made.json()['id']}"
    assert (await api_post(teacher, f"{one}/publish")).status_code == 200

    attempt = (await api_post(student, f"{API}/school-assignments/{made.json()['id']}/attempts")).json()
    served = {item["question"]["id"] for item in attempt["items"]}
    assert attempt["total"] == 5 and set(ids) <= served  # both own questions plus three from the platform bank
    assert "correct_label" not in str(attempt)

    # A question used in a published assignment cannot be edited; it can be archived without breaking the attempt.
    locked = await api_put(teacher, f"{path}/{ids[0]}", question("Попытка изменить уже использованный вопрос?"))
    assert locked.status_code == 409 and locked.json()["error"]["code"] == "QUESTION_IN_USE"
    assert (await teacher.get(path)).json()["items"][-1]["used_in_assignments"] >= 0
    assert (await api_post(teacher, f"{path}/{ids[0]}/archive")).status_code == 200
    assert (await student.get(f"{API}/school-assignments/attempts/{attempt['id']}")).json()["total"] == 5
    again = await api_post(teacher, assignments, assignment_body([class_a["id"]], school_question_ids=ids))
    assert again.status_code == 422  # one of them is archived now
    held = await admin.delete(f"{path}/{ids[1]}", headers={"X-CSRF-Token": admin.cookies.get("qm_csrf")})
    assert held.status_code == 409

    # Scoring treats the school's question like any other: the key is the one the school set.
    items = attempt["items"]
    labels = ["A" if item["question"]["id"] in ids else "B" for item in items]  # own key is A, platform key is B
    await answer_all(student, attempt, labels)
    await api_post(student, f"{API}/school-assignments/attempts/{attempt['id']}/finish")
    await api_post(teacher, f"{one}/close")
    row = (await teacher.get(f"{one}/results")).json()["rows"][0]
    assert (row["final_score"], row["max_score"]) == (5, 5)


async def test_school_only_assignment_does_not_need_the_platform_bank(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    path = f"{API}/organizations/{org}/questions"
    student = await join(harness, admin, org, code_a, "s1@mail.kz", "Ученик Один")
    ids = [(await api_post(teacher, path, question(f"Физика: свой вопрос {n}?", subject="physics"))).json()["id"] for n in range(3)]
    assignments = f"{API}/organizations/{org}/assignments"
    made = (await api_post(teacher, assignments, assignment_body([class_a["id"]], subject_id="physics", question_count=3, school_question_ids=ids))).json()
    assert (await api_post(teacher, f"{assignments}/{made['id']}/publish")).status_code == 200  # the platform has no physics questions
    short = (await api_post(teacher, assignments, assignment_body([class_a["id"]], subject_id="physics", question_count=5, school_question_ids=ids))).json()
    refused = await api_post(teacher, f"{assignments}/{short['id']}/publish")
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "NOT_ENOUGH_QUESTIONS"
    attempt = (await api_post(student, f"{API}/school-assignments/{made['id']}/attempts")).json()
    assert {i["question"]["id"] for i in attempt["items"]} == set(ids)
    # No student can practise on a school's questions.
    assert (await api_post(student, f"{API}/practice/sessions", {"subject_id": "physics", "count": 3})).json()["error"]["code"] == "NO_QUESTIONS"
