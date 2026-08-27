"""Auth + API integration tests via HTTPX (US-001 acceptance)."""

import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.mark.asyncio
async def test_healthcheck():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"


@pytest.mark.asyncio
async def test_register_login_flow():
    import uuid

    email = f"learner-{uuid.uuid4().hex[:8]}@fidya.ai"
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        reg = await c.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "supersecret1", "display_name": "Learner"},
        )
        assert reg.status_code == 201
        token = reg.json()["access_token"]

        # duplicate registration rejected
        dup = await c.post(
            "/api/v1/auth/register",
            json={"email": email, "password": "supersecret1"},
        )
        assert dup.status_code == 409

        login = await c.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "supersecret1"},
        )
        assert login.status_code == 200

        bad = await c.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrong-password"},
        )
        assert bad.status_code == 401

    _ = token  # token usable in other tests if needed


@pytest.mark.asyncio
async def test_protected_route_requires_token():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        resp = await c.get("/api/v1/analytics/progress")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_curriculum_generation_mock_pipeline():
    """Full Architect pipeline with MockLLM — schema compliance (US-007)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        reg = await c.post(
            "/api/v1/auth/register",
            json={"email": f"gen-{uuid.uuid4().hex[:8]}@t.io", "password": "supersecret1"},
        )
        token = reg.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        resp = await c.post(
            "/api/v1/curriculum/generate",
            headers=headers,
            json={
                "target_topic": "RAG systems",
                "current_level": "Intermediate",
                "target_deadline": "2026-12-01",
                "hours_per_week": 10,
                "learning_style": "Project-based",
                "target_outcome": "Ship a grounded RAG service",
            },
        )
        assert resp.status_code == 200
        curriculum = resp.json()["curriculum"]
        assert curriculum["curriculum_id"]
        assert isinstance(curriculum["modules"], list)
        assert len(curriculum["modules"]) > 0
        for m in curriculum["modules"]:
            assert {"module_id", "title", "week", "day", "objectives"} <= set(m)

        # fetch it back
        got = await c.get(f"/api/v1/curriculum/{curriculum['curriculum_id']}", headers=headers)
        assert got.status_code == 200

        # mark module complete (progress persistence)
        mid = curriculum["modules"][0]["module_id"]
        done = await c.patch(
            f"/api/v1/curriculum/{curriculum['curriculum_id']}/modules/{mid}/complete?completed=true",
            headers=headers,
        )
        assert done.status_code == 200
        assert done.json()["module"]["completion"] == 100

        # analytics reflects completion
        prog = await c.get("/api/v1/analytics/progress", headers=headers)
        assert prog.status_code == 200
        assert prog.json()["modules_completed"] >= 1
