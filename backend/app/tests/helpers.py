from httpx import AsyncClient, Response

PASSWORD = "CorrectHorse42"
NAME = "Алия Касымова"
EMAIL = "aliya@qazmind.kz"


async def csrf_headers(http: AsyncClient) -> dict[str, str]:
    """Same flow as the browser: read the qm_csrf cookie, or fetch it once, then echo it in a header."""
    token = http.cookies.get("qm_csrf")
    if not token:
        response = await http.get("/api/v1/auth/csrf")
        token = response.json()["csrf_token"]
    return {"X-CSRF-Token": token}


async def api_post(http: AsyncClient, path: str, json: dict | None = None) -> Response:
    return await http.post(path, json=json, headers=await csrf_headers(http))


async def api_patch(http: AsyncClient, path: str, json: dict) -> Response:
    return await http.patch(path, json=json, headers=await csrf_headers(http))


async def register_and_verify(harness, email: str = EMAIL, password: str = PASSWORD, name: str = NAME) -> None:
    """Register, follow the verification link from the mail; leaves the client logged in."""
    response = await api_post(harness.http, "/api/v1/auth/register", {"name": name, "email": email, "password": password})
    assert response.status_code == 202
    token = harness.mailer.token_for(email, "подтвердите email")
    response = await api_post(harness.http, "/api/v1/auth/verify-email", {"token": token})
    assert response.status_code == 200, response.text
