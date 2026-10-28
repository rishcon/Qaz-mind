"""The language of a class: Russian or Kazakh. Its students take school assignments in that language."""

from app.tests.helpers import api_patch, api_post
from app.tests.test_assignments import body as assignment_body
from app.tests.test_assignments import join, world
from app.tests.test_school_questions import question
from app.tests.test_schools import API


async def test_a_class_has_a_language_and_its_students_get_assignments_in_it(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    classes = f"{API}/organizations/{org}/classes"
    year = {"academic_year": "2026-2027"}

    assert class_a["language"] == "ru"  # the default
    kazakh = await api_post(admin, classes, {"name": "11 К", "language": "kz", **year})
    assert kazakh.status_code == 201 and kazakh.json()["language"] == "kz"
    assert (await api_post(admin, classes, {"name": "11 Э", "language": "en", **year})).status_code == 422
    changed = await api_patch(admin, f"{classes}/{class_b['id']}", {"language": "kz"})
    assert changed.json()["language"] == "kz"
    assert [c["language"] for c in (await admin.get(classes)).json() if c["name"] == "11 Б"] == ["kz"]
    detail = (await owner.get(f"{API}/admin/organizations/{org}")).json()
    assert {c["name"]: c["language"] for c in detail["classes"]} == {"11 А": "ru", "11 Б": "kz", "11 К": "kz"}

    # An assignment for both a Russian and a Kazakh class: every student sees it in the language of their own class.
    ru_student = await join(harness, admin, org, code_a, "ru@mail.kz", "Русский Ученик")
    kz_student = await join(harness, admin, org, code_b, "kz@mail.kz", "Казахский Ученик")
    assignments = f"{API}/organizations/{org}/assignments"
    made = (await api_post(admin, assignments, assignment_body([class_a["id"], class_b["id"]]))).json()
    assert made["kz_missing"] is None  # a draft has no composition yet
    published = (await api_post(admin, f"{assignments}/{made['id']}/publish")).json()
    for student, language in ((ru_student, "ru"), (kz_student, "kz")):
        mine = (await student.get(f"{API}/me/school-assignments")).json()[0]
        assert mine["language"] == language
        attempt = (await api_post(student, f"{API}/school-assignments/{made['id']}/attempts")).json()
        assert attempt["language"] == language
    # The platform questions of the test bank have no Kazakh text, which the teacher is told about.
    assert published["kz_missing"] == 5


async def test_kazakh_translations_of_own_questions_reduce_the_warning(harness):
    owner, org, admin, teacher, class_a, class_b, code_a, code_b = await world(harness)
    await api_patch(admin, f"{API}/organizations/{org}/classes/{class_b['id']}", {"language": "kz"})
    path = f"{API}/organizations/{org}/questions"
    translated = (
        await api_post(teacher, path, question("Орыс тіліндегі мәтін бар сұрақ?", text_kz="Қазақша мәтіні бар сұрақ?"))
    ).json()
    plain = (await api_post(teacher, path, question("Вопрос только на русском языке?"))).json()
    assignments = f"{API}/organizations/{org}/assignments"

    ru_only = (await api_post(admin, assignments, assignment_body([class_a["id"]], school_question_ids=[translated["id"]]))).json()
    assert (await api_post(admin, f"{assignments}/{ru_only['id']}/publish")).json()["kz_missing"] is None  # no Kazakh class

    both = (await api_post(admin, assignments, assignment_body([class_b["id"]], question_count=4, school_question_ids=[translated["id"], plain["id"]]))).json()
    result = (await api_post(admin, f"{assignments}/{both['id']}/publish")).json()
    assert result["kz_missing"] == 3  # 2 platform questions and the plain one lack Kazakh text; the translated one has it
