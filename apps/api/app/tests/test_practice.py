from app.tests.helpers import api_post, register_and_verify
from app.tests.test_admin import imported, staff

BANK = "/api/v1/admin/questions"
PRACTICE = "/api/v1/practice"


async def publish_bank(harness, count: int, subject: str = "history_kz") -> None:
    """Imports `count` questions and publishes them as the owner (the owner may approve their own)."""
    owner = await staff(harness, "owner@qazmind.kz", ["OWNER"])
    rows = [imported(f"p-{subject}-{i}", subject, text_ru=f"Вопрос {i} для практики по предмету?") for i in range(count)]
    assert (await api_post(owner, BANK + "/import", {"rows": rows})).status_code == 201
    for action in ("submit", "approve", "publish"):
        done = await api_post(owner, BANK + "/bulk", {"action": action, "filter": {"subject_id": subject}})
        assert done.json()["done"] == count


async def test_practice_needs_a_student_session(harness):
    assert (await harness.http.get(PRACTICE + "/subjects")).status_code == 401
    assert (await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "history_kz"})).status_code == 401


async def test_no_session_without_published_questions(harness):
    await register_and_verify(harness)
    assert (await harness.http.get(PRACTICE + "/subjects")).json() == []
    refused = await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "history_kz"})
    assert refused.status_code == 409 and refused.json()["error"]["code"] == "NO_QUESTIONS"
    unknown = await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "astrology"})
    assert unknown.status_code == 404


async def test_session_hides_the_key_and_checks_answers_on_the_server(harness):
    await publish_bank(harness, 6)
    # A draft is never offered to students.
    owner = await staff(harness, "writer@qazmind.kz", ["CONTENT_MANAGER"])
    draft = await api_post(owner, BANK + "/import", {"rows": [imported("p-draft", text_ru="Черновик не для учеников?")]})
    assert draft.status_code == 201

    await register_and_verify(harness)
    assert (await harness.http.get(PRACTICE + "/subjects")).json() == [{"subject_id": "history_kz", "available": 6}]

    started = await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "history_kz", "count": 4})
    assert started.status_code == 201, started.text
    session = started.json()
    assert session["total"] == 4 and session["answered"] == 0
    for item in session["items"]:
        assert item["review"] is None
        assert set(item["question"]) == {"id", "difficulty", "text_ru", "text_kz", "options"}
        assert "correct_label" not in str(item) and "explanation" not in str(item)

    first = session["items"][0]["question"]["id"]
    right = await api_post(harness.http, f"{PRACTICE}/sessions/{session['id']}/answers", {"question_id": first, "selected_label": "B"})
    # The test bank keys every question to B.
    assert right.status_code == 200 and right.json()["is_correct"] is True and right.json()["correct_label"] == "B"
    assert right.json()["explanation_ru"]

    second = session["items"][1]["question"]["id"]
    wrong = await api_post(harness.http, f"{PRACTICE}/sessions/{session['id']}/answers", {"question_id": second, "selected_label": "A"})
    assert wrong.json()["is_correct"] is False and wrong.json()["correct_label"] == "B"

    again = await api_post(harness.http, f"{PRACTICE}/sessions/{session['id']}/answers", {"question_id": first, "selected_label": "A"})
    assert again.status_code == 409 and again.json()["error"]["code"] == "ALREADY_ANSWERED"
    bad_option = await api_post(harness.http, f"{PRACTICE}/sessions/{session['id']}/answers", {"question_id": session["items"][2]["question"]["id"], "selected_label": "E"})
    assert bad_option.status_code == 422

    # Reloading shows the same questions with the answers given so far.
    resumed = (await harness.http.get(f"{PRACTICE}/sessions/{session['id']}")).json()
    assert [i["question"]["id"] for i in resumed["items"]] == [i["question"]["id"] for i in session["items"]]
    assert resumed["answered"] == 2 and resumed["correct"] == 1
    assert resumed["items"][2]["review"] is None

    finished = (await api_post(harness.http, f"{PRACTICE}/sessions/{session['id']}/finish")).json()
    assert finished["finished_at"] and finished["total"] == 4 and finished["correct"] == 1
    late = await api_post(harness.http, f"{PRACTICE}/sessions/{session['id']}/answers", {"question_id": session["items"][3]["question"]["id"], "selected_label": "B"})
    assert late.status_code == 409 and late.json()["error"]["code"] == "SESSION_FINISHED"
    assert (await harness.http.get(PRACTICE + "/stats")).json() == {"answered": 2, "correct": 1}


async def test_a_student_cannot_open_or_answer_someone_elses_session(harness):
    await publish_bank(harness, 3)
    await register_and_verify(harness)
    session = (await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "history_kz", "count": 3})).json()

    other = await harness.new_client()
    registered = await api_post(other, "/api/v1/auth/register", {"name": "Второй", "email": "second@qazmind.kz", "password": "CorrectHorse42"})
    assert registered.status_code == 202
    token = harness.mailer.token_for("second@qazmind.kz", "подтвердите email")
    assert (await api_post(other, "/api/v1/auth/verify-email", {"token": token})).status_code == 200

    assert (await other.get(f"{PRACTICE}/sessions/{session['id']}")).status_code == 404
    qid = session["items"][0]["question"]["id"]
    stolen = await api_post(other, f"{PRACTICE}/sessions/{session['id']}/answers", {"question_id": qid, "selected_label": "B"})
    assert stolen.status_code == 404
    assert (await api_post(other, f"{PRACTICE}/sessions/{session['id']}/finish")).status_code == 404
    assert (await other.get(PRACTICE + "/stats")).json() == {"answered": 0, "correct": 0}


async def test_unseen_and_missed_questions_come_before_known_ones(harness):
    await publish_bank(harness, 4)
    await register_and_verify(harness)
    first = (await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "history_kz", "count": 2})).json()
    solved = first["items"][0]["question"]["id"]
    missed = first["items"][1]["question"]["id"]
    await api_post(harness.http, f"{PRACTICE}/sessions/{first['id']}/answers", {"question_id": solved, "selected_label": "B"})
    await api_post(harness.http, f"{PRACTICE}/sessions/{first['id']}/answers", {"question_id": missed, "selected_label": "A"})

    # Two questions were never seen: a session of three has both of them and then the missed one, not the solved one.
    second = (await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "history_kz", "count": 3})).json()
    ids = {i["question"]["id"] for i in second["items"]}
    assert missed in ids and solved not in ids
