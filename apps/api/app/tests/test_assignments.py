"""School assignments: teacher rights, fixed composition, attempts, result visibility and isolation."""

from datetime import timedelta

from sqlalchemy import text

from app.core.time import utcnow
from app.tests.helpers import api_post, api_put
from app.tests.test_admin import staff
from app.tests.test_practice import publish_bank
from app.tests.test_school_access import add_teacher, give_license, make_code, school_with_class
from app.tests.test_schools import API, approved_school, person

# In the test bank the key of every question is "B".
RIGHT, WRONG = "B", "A"


def body(class_ids, **extra) -> dict:
    data = {
        "title": "Контрольная по истории",
        "subject_id": "history_kz",
        "question_count": 5,
        "class_ids": class_ids,
        "due_at": (utcnow() + timedelta(days=3)).isoformat(),
        "max_attempts": 1,
        "score_policy": "best",
        "reveal": "after_close",
    }
    data.update(extra)
    return data


async def join(harness, admin, org: str, code: str, email: str, name: str):
    """A student joins by code and the administrator approves."""
    student = await person(harness, email, name)
    request = (await api_post(student, f"{API}/classes/join-requests", {"code": code})).json()
    assert (await api_post(admin, f"{API}/classes/join-requests/{request['id']}/approve")).status_code == 200
    return student


async def answer_all(student, attempt: dict, labels) -> None:
    for item, label in zip(attempt["items"], labels):
        done = await api_post(
            student,
            f"{API}/school-assignments/attempts/{attempt['id']}/answers",
            {"question_id": item["question"]["id"], "selected_label": label},
        )
        assert done.status_code == 204, done.text


async def world(harness):
    """School A with classes 11 А and 11 Б, a licence, a bank of 8 published questions and a teacher of 11 А."""
    await publish_bank(harness, 8)
    owner = await staff(harness, "boss@qazmind.kz", ["OWNER"])
    org, admin, class_a = await school_with_class(harness, owner)
    class_b = (await api_post(admin, f"{API}/organizations/{org}/classes", {"name": "11 Б", "academic_year": "2026-2027"})).json()
    await give_license(owner, org, seats=10)
    teacher = await add_teacher(harness, admin, org, class_a["id"], "teacher@school.kz")
    code_a = (await make_code(admin, org, class_a["id"]))["code"]
    code_b = (await make_code(admin, org, class_b["id"]))["code"]
    return owner, org, admin, teacher, class_a, class_b, code_a, code_b


async def test_teacher_creates_publishes_and_closes_an_assignment(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    s1 = await join(harness, admin, org, code_a, "s1@mail.kz", "Ученик Один")
    s2 = await join(harness, admin, org, code_a, "s2@mail.kz", "Ученик Два")
    s3 = await join(harness, admin, org, code_b, "s3@mail.kz", "Ученик Три")
    path = f"{API}/organizations/{org}/assignments"

    # A teacher cannot give an assignment to a class that is not theirs, nor use an unknown subject or a past deadline.
    assert (await api_post(teacher, path, body([class_b["id"]]))).status_code == 404
    assert (await api_post(teacher, path, body([class_a["id"]], subject_id="astrology"))).status_code == 404
    past = await api_post(teacher, path, body([class_a["id"]], due_at=(utcnow() - timedelta(days=1)).isoformat()))
    assert past.status_code == 422 and past.json()["error"]["code"] == "DUE_IN_PAST"

    created = await api_post(teacher, path, body([class_a["id"]]))
    assert created.status_code == 201, created.text
    assignment = created.json()
    assert assignment["status"] == "draft" and assignment["created_by"] == "Учитель Истории"
    one = f"{path}/{assignment['id']}"

    # A draft is invisible to students, and an assignment cannot be built from content that does not exist.
    assert (await s1.get(f"{API}/me/school-assignments")).json() == []
    big = (await api_post(teacher, path, body([class_a["id"]], question_count=20))).json()
    refused = await api_post(teacher, f"{path}/{big['id']}/publish")
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "NOT_ENOUGH_QUESTIONS"

    # School B's administrator and a teacher of another class know nothing about it.
    other_org, other_admin = await approved_school(harness, owner, "b@school.kz", "Школа Б")
    assert (await other_admin.get(f"{API}/organizations/{org}/assignments")).status_code == 404
    assert (await other_admin.get(f"{API}/organizations/{other_org}/assignments/{assignment['id']}")).status_code == 404
    other_teacher = await add_teacher(harness, admin, org, class_b["id"], "teacher-b@school.kz")
    assert (await other_teacher.get(one)).status_code == 404
    assert assignment["id"] not in [a["id"] for a in (await other_teacher.get(path)).json()]
    assert (await api_post(other_teacher, f"{one}/publish")).status_code == 404

    published = await api_post(teacher, f"{one}/publish")
    assert published.status_code == 200 and published.json()["status"] == "published"
    assert (await api_post(teacher, f"{one}/publish")).status_code == 409
    assert (await api_put(teacher, one, body([class_a["id"]]))).status_code == 409  # only a draft can be edited

    # Only the students of the class see it; the composition is fixed.
    mine = (await s1.get(f"{API}/me/school-assignments")).json()
    assert [a["title"] for a in mine] == ["Контрольная по истории"] and mine[0]["can_start"] is True
    assert (await s3.get(f"{API}/me/school-assignments")).json() == []
    assert (await api_post(s3, f"{API}/school-assignments/{assignment['id']}/attempts")).status_code == 404

    started = await api_post(s1, f"{API}/school-assignments/{assignment['id']}/attempts")
    assert started.status_code == 201
    attempt = started.json()
    assert attempt["total"] == 5 and attempt["result_visible"] is False
    # The key and the explanation are not in the answer and not in any item.
    assert "correct_label" not in started.text and "explanation" not in started.text
    assert all(item["review"] is None and "correct_label" not in item["question"] for item in attempt["items"])
    same = await api_post(s1, f"{API}/school-assignments/{assignment['id']}/attempts")
    assert same.json()["id"] == attempt["id"] and same.status_code == 201  # resumes instead of a second attempt

    await answer_all(s1, attempt, [WRONG, RIGHT, RIGHT, RIGHT, RIGHT])
    await answer_all(s1, {**attempt, "items": attempt["items"][:1]}, [RIGHT])  # an answer may be changed before submitting
    finished = (await api_post(s1, f"{API}/school-assignments/attempts/{attempt['id']}/finish")).json()
    assert finished["submitted_at"] is not None
    assert finished["result_visible"] is False and finished["score"] is None  # the teacher chose "after close"
    assert (await api_post(s1, f"{API}/school-assignments/{assignment['id']}/attempts")).json()["error"]["code"] == "NO_ATTEMPTS_LEFT"
    late = await api_post(s1, f"{API}/school-assignments/attempts/{attempt['id']}/answers", {"question_id": attempt["items"][0]["question"]["id"], "selected_label": WRONG})
    assert late.status_code == 409

    # Another student's attempt is not reachable.
    assert (await s2.get(f"{API}/school-assignments/attempts/{attempt['id']}")).status_code == 404
    assert (await api_post(s2, f"{API}/school-assignments/attempts/{attempt['id']}/finish")).status_code == 404

    # s2 answers two questions and leaves; closing submits that attempt with what was saved.
    second = (await api_post(s2, f"{API}/school-assignments/{assignment['id']}/attempts")).json()
    await answer_all(s2, {**second, "items": second["items"][:2]}, [RIGHT, WRONG])
    results = (await teacher.get(f"{one}/results")).json()
    states = {r["name"]: r["state"] for r in results["rows"]}
    assert states == {"Ученик Один": "submitted", "Ученик Два": "in_progress"} and results["total_students"] == 2
    assert {r["name"]: r["final_score"] for r in results["rows"]}["Ученик Один"] == 5

    closed = await api_post(teacher, f"{one}/close")
    assert closed.json()["status"] == "closed"
    results = (await teacher.get(f"{one}/results")).json()
    by_name = {r["name"]: r for r in results["rows"]}
    assert by_name["Ученик Два"]["state"] == "submitted" and by_name["Ученик Два"]["final_score"] == 1
    assert by_name["Ученик Один"]["max_score"] == 5 and results["average_final"] == 3.0
    assert (await admin.get(f"{one}/results")).status_code == 200

    # After closing, the students see their score and the key; new attempts are impossible.
    after = (await s1.get(f"{API}/school-assignments/attempts/{attempt['id']}")).json()
    assert after["result_visible"] is True and after["score"] == 5
    assert all(item["review"]["correct_label"] == RIGHT for item in after["items"])
    listed = (await s2.get(f"{API}/me/school-assignments")).json()[0]
    assert listed["final_score"] == 1 and listed["can_start"] is False and listed["status"] == "closed"
    assert (await api_post(teacher, f"{one}/close")).status_code == 409
    assert (await api_post(teacher, f"{one}/archive")).json()["status"] == "archived"
    assert (await s1.get(f"{API}/me/school-assignments")).json() == []

    # School results never touch the student's personal practice progress.
    assert (await s1.get(f"{API}/practice/stats")).json() == {"answered": 0, "correct": 0}
    assert (await s1.get(f"{API}/practice/mistakes")).json() == []


async def test_attempts_policy_reveal_and_deadline(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    student = await join(harness, admin, org, code_a, "s1@mail.kz", "Ученик Один")
    path = f"{API}/organizations/{org}/assignments"
    ids = {}
    for policy in ("best", "last"):
        made = (
            await api_post(teacher, path, body([class_a["id"]], title=f"Политика {policy}", max_attempts=2, score_policy=policy, reveal="after_submit"))
        ).json()
        assert (await api_post(teacher, f"{path}/{made['id']}/publish")).status_code == 200
        ids[policy] = made["id"]
        first = (await api_post(student, f"{API}/school-assignments/{made['id']}/attempts")).json()
        await answer_all(student, first, [RIGHT] * 5)
        done = (await api_post(student, f"{API}/school-assignments/attempts/{first['id']}/finish")).json()
        # "After submit": the score and the key are visible straight away.
        assert done["result_visible"] is True and done["score"] == 5
        second = (await api_post(student, f"{API}/school-assignments/{made['id']}/attempts")).json()
        assert second["number"] == 2
        await answer_all(student, second, [WRONG] * 5)
        assert (await api_post(student, f"{API}/school-assignments/attempts/{second['id']}/finish")).json()["score"] == 0
        assert (await api_post(student, f"{API}/school-assignments/{made['id']}/attempts")).json()["error"]["code"] == "NO_ATTEMPTS_LEFT"
        row = (await teacher.get(f"{path}/{made['id']}/results")).json()["rows"][0]
        assert (row["best_score"], row["last_score"], row["attempts"]) == (5, 0, 2)
        assert row["final_score"] == (5 if policy == "best" else 0)
    mine = {a["title"]: a for a in (await student.get(f"{API}/me/school-assignments")).json()}
    assert mine["Политика best"]["final_score"] == 5 and mine["Политика last"]["final_score"] == 0

    # After the deadline nobody can start or change answers, but a started attempt can still be submitted.
    late = (await api_post(teacher, path, body([class_a["id"]], title="С дедлайном"))).json()
    await api_post(teacher, f"{path}/{late['id']}/publish")
    attempt = (await api_post(student, f"{API}/school-assignments/{late['id']}/attempts")).json()
    await answer_all(student, {**attempt, "items": attempt["items"][:2]}, [RIGHT, RIGHT])
    async with harness.session_factory() as db:
        await db.execute(text("UPDATE assignments SET due_at = now() - interval '1 minute' WHERE title = 'С дедлайном'"))
        await db.commit()
    blocked = await api_post(
        student, f"{API}/school-assignments/attempts/{attempt['id']}/answers", {"question_id": attempt["items"][2]["question"]["id"], "selected_label": RIGHT}
    )
    assert blocked.status_code == 409 and blocked.json()["error"]["code"] == "DUE_PASSED"
    finished = await api_post(student, f"{API}/school-assignments/attempts/{attempt['id']}/finish")
    assert finished.status_code == 200 and finished.json()["submitted_at"] is not None
    row = (await teacher.get(f"{path}/{late['id']}/results")).json()["rows"][0]
    assert row["final_score"] == 2

    # A student who left the class loses access; the recorded attempt stays in the results history of the teacher's data.
    student_id = (await student.get(f"{API}/auth/me")).json()["user"]["id"]
    assert (await api_post(admin, f"{API}/organizations/{org}/classes/{class_a['id']}/students/{student_id}/remove")).status_code == 204
    assert (await student.get(f"{API}/me/school-assignments")).json() == []
    assert (await api_post(student, f"{API}/school-assignments/{ids['best']}/attempts")).status_code == 404
