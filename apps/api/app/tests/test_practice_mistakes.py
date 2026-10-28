from app.tests.helpers import api_post, register_and_verify
from app.tests.test_practice import PRACTICE, publish_bank


async def test_mistakes_come_from_wrong_answers_and_are_resolved_by_a_correct_retry(harness):
    await publish_bank(harness, 3)
    await register_and_verify(harness)
    assert (await harness.http.get(PRACTICE + "/mistakes")).json() == []

    session = (await api_post(harness.http, PRACTICE + "/sessions", {"subject_id": "history_kz", "count": 3})).json()
    ids = [i["question"]["id"] for i in session["items"]]
    answers = f"{PRACTICE}/sessions/{session['id']}/answers"
    await api_post(harness.http, answers, {"question_id": ids[0], "selected_label": "B"})
    await api_post(harness.http, answers, {"question_id": ids[1], "selected_label": "C"})

    mistakes = (await harness.http.get(PRACTICE + "/mistakes")).json()
    assert [m["question_id"] for m in mistakes] == [ids[1]]
    only = mistakes[0]
    assert only["wrong_label"] == "C" and only["correct_label"] == "B" and only["wrong_count"] == 1
    assert only["resolved"] is False and only["explanation_ru"]

    # A question that was never answered wrongly cannot be retried through the mistakes list.
    never = await api_post(harness.http, f"{PRACTICE}/mistakes/{ids[0]}/retry", {"selected_label": "B"})
    assert never.status_code == 404

    wrong_again = await api_post(harness.http, f"{PRACTICE}/mistakes/{ids[1]}/retry", {"selected_label": "A"})
    assert wrong_again.json()["is_correct"] is False
    assert (await harness.http.get(PRACTICE + "/mistakes")).json()[0]["wrong_count"] == 2

    fixed = await api_post(harness.http, f"{PRACTICE}/mistakes/{ids[1]}/retry", {"selected_label": "B"})
    assert fixed.json()["is_correct"] is True
    after = (await harness.http.get(PRACTICE + "/mistakes")).json()
    assert after[0]["resolved"] is True and after[0]["wrong_count"] == 2
    assert (await harness.http.get(PRACTICE + "/stats")).json() == {"answered": 4, "correct": 2}

    # Another student sees none of this.
    other = await harness.new_client()
    registered = await api_post(
        other, "/api/v1/auth/register", {"name": "Второй", "email": "second@qazmind.kz", "password": "CorrectHorse42"}
    )
    assert registered.status_code == 202
    token = harness.mailer.token_for("second@qazmind.kz", "подтвердите email")
    assert (await api_post(other, "/api/v1/auth/verify-email", {"token": token})).status_code == 200
    assert (await other.get(PRACTICE + "/mistakes")).json() == []
    stolen = await api_post(other, f"{PRACTICE}/mistakes/{ids[1]}/retry", {"selected_label": "B"})
    assert stolen.status_code == 404
