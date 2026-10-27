from httpx import ASGITransport, AsyncClient

from app.tests.helpers import PASSWORD, api_patch, api_post, register_and_verify

ONBOARDING = {
    "interface_lang": "ru",
    "exam_lang": "ru",
    "profile_pair_id": "math_phys",
    "target_score": 140,
    "exam_year": 2026,
    "exam_period": "june_main",
    "daily_goal_minutes": 45,
}


async def _register_second_user(harness, email: str) -> AsyncClient:
    client = await harness.new_client()
    await api_post(client, "/api/v1/auth/register", {"name": "Второй ученик", "email": email, "password": PASSWORD})
    token = harness.mailer.token_for(email, "подтвердите email")
    await api_post(client, "/api/v1/auth/verify-email", {"token": token})
    return client


async def test_profile_endpoints_require_a_session(harness):
    assert (await harness.http.get("/api/v1/me/profile")).status_code == 401
    assert (await harness.http.get("/api/v1/me/workspaces")).status_code == 401


async def test_profile_is_not_found_until_onboarding_is_completed(harness):
    await register_and_verify(harness)
    response = await harness.http.get("/api/v1/me/profile")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "PROFILE_NOT_FOUND"


async def test_completing_onboarding_is_saved_and_reflected_in_me(harness):
    await register_and_verify(harness)
    response = await api_post(harness.http, "/api/v1/me/onboarding/complete", ONBOARDING)
    assert response.status_code == 200
    body = response.json()
    assert body["profile_pair_id"] == "math_phys"
    assert body["target_score"] == 140
    assert body["onboarding_completed_at"] is not None

    me = await harness.http.get("/api/v1/auth/me")
    assert me.json()["onboarding_completed"] is True

    stored = await harness.http.get("/api/v1/me/profile")
    assert stored.status_code == 200
    assert stored.json() == body


async def test_onboarding_rejects_invalid_values_with_field_details(harness):
    await register_and_verify(harness)
    cases = [
        {"target_score": 150},
        {"target_score": 59},
        {"profile_pair_id": "does_not_exist"},
        {"daily_goal_minutes": 5},
        {"exam_period": "ent_2027", "exam_year": 2026},
        {"exam_period": "june_main", "exam_year": 2027},
        {"unexpected_field": "x"},
    ]
    for override in cases:
        response = await api_post(harness.http, "/api/v1/me/onboarding/complete", {**ONBOARDING, **override})
        assert response.status_code == 422, override
        assert response.json()["error"]["code"] == "VALIDATION_ERROR", override


async def test_updates_keep_the_original_completion_time(harness):
    await register_and_verify(harness)
    first = (await api_post(harness.http, "/api/v1/me/onboarding/complete", ONBOARDING)).json()

    patched = await api_patch(harness.http, "/api/v1/me/profile", {"target_score": 120, "exam_lang": "kz"})
    assert patched.status_code == 200
    body = patched.json()
    assert body["target_score"] == 120
    assert body["exam_lang"] == "kz"
    assert body["profile_pair_id"] == "math_phys"
    assert body["onboarding_completed_at"] == first["onboarding_completed_at"]


async def test_update_before_onboarding_is_a_conflict(harness):
    await register_and_verify(harness)
    response = await api_patch(harness.http, "/api/v1/me/profile", {"target_score": 120})
    assert response.status_code == 409
    assert response.json()["error"]["code"] == "ONBOARDING_REQUIRED"


async def test_update_rejects_explicit_nulls_and_inconsistent_exam_period(harness):
    await register_and_verify(harness)
    await api_post(harness.http, "/api/v1/me/onboarding/complete", ONBOARDING)

    nulled = await api_patch(harness.http, "/api/v1/me/profile", {"target_score": None})
    assert nulled.status_code == 422

    inconsistent = await api_patch(harness.http, "/api/v1/me/profile", {"exam_period": "ent_2027"})
    assert inconsistent.status_code == 422
    assert inconsistent.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_each_user_sees_only_their_own_profile(harness):
    await register_and_verify(harness)
    await api_post(harness.http, "/api/v1/me/onboarding/complete", ONBOARDING)

    other = await _register_second_user(harness, "second@qazmind.kz")
    try:
        before = await other.get("/api/v1/me/profile")
        assert before.status_code == 404

        await api_post(other, "/api/v1/me/onboarding/complete", {**ONBOARDING, "profile_pair_id": "chem_bio"})
        own = (await other.get("/api/v1/me/profile")).json()
        assert own["profile_pair_id"] == "chem_bio"

        first_user = (await harness.http.get("/api/v1/me/profile")).json()
        assert first_user["profile_pair_id"] == "math_phys"
    finally:
        await other.aclose()


async def test_catalog_lists_the_six_official_pairs_without_login(harness):
    anonymous = AsyncClient(transport=ASGITransport(app=harness.app), base_url="http://testserver")
    try:
        response = await anonymous.get("/api/v1/catalog/profile-pairs")
    finally:
        await anonymous.aclose()
    assert response.status_code == 200
    pairs = response.json()
    assert [pair["id"] for pair in pairs] == [
        "math_phys",
        "chem_bio",
        "geo_math",
        "hist_geo",
        "kaz_lang_lit",
        "foreign_hist",
    ]
    assert pairs[0]["subject_codes"] == ["math_prof", "physics"]


async def test_workspaces_contain_the_personal_space(harness):
    await register_and_verify(harness)
    response = await harness.http.get("/api/v1/me/workspaces")
    assert response.status_code == 200
    assert [w["type"] for w in response.json()] == ["personal"]
