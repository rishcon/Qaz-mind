import pytest
from pydantic import ValidationError
from sqlalchemy import select

from app.content.schemas import ContentFile
from app.content.service import ContentError, apply_transition, import_content
from app.models import Lesson, LessonVersion
from app.tests.helpers import NAME, PASSWORD, api_post, api_put, register_and_verify

AUTHOR = "Методист Айгуль"
REVIEWER = "Ревьюер Бекзат"


def sample_file(subject: str, topic_slug: str, lesson_slugs: list[str], author: str = AUTHOR) -> dict:
    lessons = []
    for position, slug in enumerate(lesson_slugs, start=1):
        lessons.append(
            {
                "slug": slug,
                "position": position,
                "title_ru": f"Урок {slug}",
                "title_kz": f"Сабақ {slug}",
                "estimated_minutes": 10,
                "source_reference": "Учебник для 11 класса, глава 1",
                "steps": [
                    {"heading_ru": "Шаг 1", "heading_kz": "1-қадам", "body_ru": "Текст первого шага", "body_kz": "Бірінші қадам мәтіні"},
                    {"heading_ru": "Шаг 2", "heading_kz": "2-қадам", "body_ru": "Текст второго шага", "body_kz": "Екінші қадам мәтіні"},
                ],
            }
        )
    return {
        "subject": subject,
        "author": author,
        "topics": [
            {
                "slug": topic_slug,
                "position": 1,
                "title_ru": f"Тема {topic_slug}",
                "title_kz": f"Тақырып {topic_slug}",
                "lessons": lessons,
            }
        ],
    }


async def import_only(harness, data: dict):
    async with harness.session_factory() as db:
        return await import_content(db, ContentFile.model_validate(data))


async def transition(harness, slug: str, version: int, action: str, actor: str):
    async with harness.session_factory() as db:
        return await apply_transition(db, slug, version, action, actor)


async def publish(harness, data: dict) -> None:
    result = await import_only(harness, data)
    for slug, version in result.created:
        await transition(harness, slug, version, "submit", AUTHOR)
        await transition(harness, slug, version, "approve", REVIEWER)
        await transition(harness, slug, version, "publish", REVIEWER)


async def test_import_creates_drafts_that_students_cannot_see(harness):
    await import_only(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await register_and_verify(harness)

    subjects = (await harness.http.get("/api/v1/subjects")).json()
    history = next(s for s in subjects if s["id"] == "history_kz")
    assert history["published_lessons"] == 0

    lesson = await harness.http.get("/api/v1/lessons/khanate-foundation")
    assert lesson.status_code == 404
    assert lesson.json()["error"]["code"] == "LESSON_NOT_FOUND"

    curriculum = (await harness.http.get("/api/v1/subjects/history_kz/curriculum")).json()
    assert curriculum["topics"] == []


async def test_author_cannot_approve_or_publish_own_material(harness):
    await import_only(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await transition(harness, "khanate-foundation", 1, "submit", AUTHOR)

    with pytest.raises(ContentError, match="Автор не может"):
        await transition(harness, "khanate-foundation", 1, "approve", AUTHOR)

    await transition(harness, "khanate-foundation", 1, "approve", REVIEWER)
    with pytest.raises(ContentError, match="Автор не может"):
        await transition(harness, "khanate-foundation", 1, "publish", AUTHOR)
    await transition(harness, "khanate-foundation", 1, "publish", REVIEWER)


async def test_transitions_follow_the_lifecycle(harness):
    await import_only(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    with pytest.raises(ContentError, match="возможно только из статуса «approved»"):
        await transition(harness, "khanate-foundation", 1, "publish", REVIEWER)
    with pytest.raises(ContentError, match="Неизвестное действие"):
        await transition(harness, "khanate-foundation", 1, "teleport", REVIEWER)


async def test_publishing_a_new_version_archives_the_previous_one(harness):
    await publish(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await import_only(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await transition(harness, "khanate-foundation", 2, "submit", AUTHOR)
    await transition(harness, "khanate-foundation", 2, "approve", REVIEWER)
    await transition(harness, "khanate-foundation", 2, "publish", REVIEWER)

    await register_and_verify(harness)
    lesson = (await harness.http.get("/api/v1/lessons/khanate-foundation")).json()
    assert lesson["version"] == 2

    async with harness.session_factory() as db:
        lesson_row = (await db.execute(select(Lesson).where(Lesson.slug == "khanate-foundation"))).scalar_one()
        statuses = dict(
            (
                await db.execute(select(LessonVersion.version, LessonVersion.status).where(LessonVersion.lesson_id == lesson_row.id))
            ).all()
        )
    assert statuses == {1: "archived", 2: "published"}


async def test_two_subjects_open_their_own_content(harness):
    await publish(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await publish(harness, sample_file("biology", "cells", ["cell-structure"], author="Методист Ерлан"))
    await register_and_verify(harness)

    subjects = {s["id"]: s for s in (await harness.http.get("/api/v1/subjects")).json()}
    assert subjects["history_kz"]["published_lessons"] == 1
    assert subjects["biology"]["published_lessons"] == 1
    assert subjects["physics"]["published_lessons"] == 0

    history = (await harness.http.get("/api/v1/subjects/history_kz/curriculum")).json()
    assert [l["slug"] for t in history["topics"] for l in t["lessons"]] == ["khanate-foundation"]

    biology = (await harness.http.get("/api/v1/subjects/biology/curriculum")).json()
    assert [l["slug"] for t in biology["topics"] for l in t["lessons"]] == ["cell-structure"]

    lesson = (await harness.http.get("/api/v1/lessons/cell-structure")).json()
    assert lesson["subject_id"] == "biology"
    assert [step["index"] for step in lesson["steps"]] == [0, 1]


async def test_empty_subject_has_no_invented_numbers(harness):
    await register_and_verify(harness)
    curriculum = (await harness.http.get("/api/v1/subjects/physics/curriculum")).json()
    assert curriculum == {
        "subject": {
            "id": "physics",
            "code": "05",
            "title_ru": "Физика",
            "title_kz": "Физика",
            "category": "profile",
            "published_lessons": 0,
        },
        "topics": [],
    }


async def test_progress_survives_reload_and_completion_is_final(harness):
    await publish(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await register_and_verify(harness)

    started = await api_put(harness.http, "/api/v1/me/lessons/khanate-foundation/progress", {"last_step": 0})
    assert started.status_code == 200
    assert started.json()["state"] == "in_progress"

    # A fresh request (as after a page reload) still sees the saved position.
    lesson = (await harness.http.get("/api/v1/lessons/khanate-foundation")).json()
    assert lesson["progress"]["state"] == "in_progress"
    assert lesson["progress"]["last_step"] == 0

    done = await api_put(
        harness.http, "/api/v1/me/lessons/khanate-foundation/progress", {"last_step": 1, "completed": True}
    )
    assert done.json()["state"] == "completed"
    completed_at = done.json()["completed_at"]
    assert completed_at is not None

    # Repeating the request, or sending an earlier step later, does not undo completion.
    again = await api_put(harness.http, "/api/v1/me/lessons/khanate-foundation/progress", {"last_step": 0})
    assert again.json()["state"] == "completed"
    assert again.json()["completed_at"] == completed_at

    mine = (await harness.http.get("/api/v1/me/progress")).json()
    assert mine == [
        {"lesson_slug": "khanate-foundation", "state": "completed", "last_step": 1, "completed_at": completed_at}
    ]

    curriculum = (await harness.http.get("/api/v1/subjects/history_kz/curriculum")).json()
    assert curriculum["topics"][0]["lessons"][0]["progress"]["state"] == "completed"


async def test_progress_is_validated_against_the_lesson(harness):
    await publish(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await register_and_verify(harness)

    beyond = await api_put(harness.http, "/api/v1/me/lessons/khanate-foundation/progress", {"last_step": 2})
    assert beyond.status_code == 422

    too_early = await api_put(
        harness.http, "/api/v1/me/lessons/khanate-foundation/progress", {"last_step": 0, "completed": True}
    )
    assert too_early.status_code == 422
    assert "последнем шаге" in too_early.json()["error"]["message"]

    missing = await api_put(harness.http, "/api/v1/me/lessons/no-such-lesson/progress", {"last_step": 0})
    assert missing.status_code == 404


async def test_progress_is_private_to_each_student(harness):
    await publish(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    await register_and_verify(harness)
    await api_put(
        harness.http, "/api/v1/me/lessons/khanate-foundation/progress", {"last_step": 1, "completed": True}
    )
    await api_post(harness.http, "/api/v1/auth/logout")

    other = await harness.new_client()
    try:
        await api_post(other, "/api/v1/auth/register", {"name": NAME, "email": "second@qazmind.kz", "password": PASSWORD})
        token = harness.mailer.token_for("second@qazmind.kz", "подтвердите email")
        await api_post(other, "/api/v1/auth/verify-email", {"token": token})
        curriculum = (await other.get("/api/v1/subjects/history_kz/curriculum")).json()
        assert curriculum["topics"][0]["lessons"][0]["progress"]["state"] == "not_started"
        assert (await other.get("/api/v1/me/progress")).json() == []
    finally:
        await other.aclose()


async def test_content_endpoints_need_a_session(harness):
    assert (await harness.http.get("/api/v1/subjects")).status_code == 401
    assert (await harness.http.get("/api/v1/lessons/any")).status_code == 401


async def test_invalid_content_file_is_rejected_before_anything_is_written(harness):
    broken = sample_file("history_kz", "khanate", ["khanate-foundation"])
    del broken["topics"][0]["lessons"][0]["title_kz"]
    with pytest.raises(ValidationError):
        ContentFile.model_validate(broken)

    bad_slug = sample_file("history_kz", "khanate", ["Khanate Foundation"])
    with pytest.raises(ValidationError):
        ContentFile.model_validate(bad_slug)

    no_steps = sample_file("history_kz", "khanate", ["khanate-foundation"])
    no_steps["topics"][0]["lessons"][0]["steps"] = []
    with pytest.raises(ValidationError):
        ContentFile.model_validate(no_steps)

    duplicate = sample_file("history_kz", "khanate", ["khanate-foundation", "khanate-foundation"])
    with pytest.raises(ValidationError):
        ContentFile.model_validate(duplicate)

    extra = sample_file("history_kz", "khanate", ["khanate-foundation"])
    extra["topics"][0]["lessons"][0]["video_url"] = "https://example.com"
    with pytest.raises(ValidationError):
        ContentFile.model_validate(extra)


async def test_unknown_subject_and_moving_a_lesson_between_topics_are_refused(harness):
    with pytest.raises(ContentError, match="не найден"):
        await import_only(harness, sample_file("astrology", "stars", ["stars-basics"]))

    await import_only(harness, sample_file("history_kz", "khanate", ["khanate-foundation"]))
    with pytest.raises(ContentError, match="другой теме"):
        await import_only(harness, sample_file("history_kz", "another-topic", ["khanate-foundation"]))
