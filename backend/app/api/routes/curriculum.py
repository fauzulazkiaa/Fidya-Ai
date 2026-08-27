"""Curriculum routes — The Architect pipeline + module synthesis + SSE."""

import asyncio
import json
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.agents.architect import architect_node
from app.agents.fact_checker import build_citations_manifest
from app.agents.state import SyntaxState
from app.agents.supervisor import run_graph_stream
from app.api.deps import get_current_user
from app.core.logging import get_logger
from app.db.supabase_client import get_store
from app.models.schemas import (
    GenerateCurriculumResponse,
    OnboardingPayload,
    SynthesizeResponse,
)

router = APIRouter(prefix="/curriculum", tags=["curriculum"])
log = get_logger(__name__, "routes.curriculum")


@router.post("/generate", response_model=GenerateCurriculumResponse)
async def generate_curriculum(
    payload: OnboardingPayload,
    user: dict = Depends(get_current_user),
):
    """US-007 — generate a personalized week-by-week syllabus via The Architect."""
    store = get_store()
    curriculum_id = f"curr_{uuid.uuid4().hex[:10]}"
    state: SyntaxState = {
        "user_id": user["user_id"],
        "intent": "generate",
        "active_goal": payload.target_topic,
        "curriculum": {
            **payload.model_dump(),
            "curriculum_id": curriculum_id,
            "target_deadline": payload.target_deadline,
        },
    }
    update = await architect_node(state)
    curriculum = update["curriculum"]
    curriculum["curriculum_id"] = curriculum_id
    curriculum["user_id"] = user["user_id"]
    curriculum.setdefault("status", "active")

    # Persist only known columns; extra computed fields stay API-only.
    DB_COLUMNS = {
        "curriculum_id", "user_id", "target_topic", "current_level",
        "target_outcome", "target_deadline", "hours_per_week",
        "learning_style", "modules", "milestones",
    }
    store.table("curricula").insert(
        {k: v for k, v in curriculum.items() if k in DB_COLUMNS}
    ).execute()
    log.info("Persisted curriculum %s for %s", curriculum_id, user["email"])
    return GenerateCurriculumResponse(curriculum=curriculum)


@router.get("")
async def list_curricula(user: dict = Depends(get_current_user)):
    """All curricula owned by the authenticated user, newest first."""
    store = get_store()
    rows = (
        store.table("curricula")
        .select("*")
        .eq("user_id", user["user_id"])
        .execute()
        .data
    )
    rows.sort(key=lambda r: r.get("created_at", ""), reverse=True)
    return {"curricula": rows}


def _load_curriculum(curriculum_id: str, user_id: str) -> dict:
    store = get_store()
    rows = (
        store.table("curricula")
        .select("*")
        .eq("curriculum_id", curriculum_id)
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Curriculum not found")
    return rows[0]


def _find_module(curriculum: dict, module_id: str) -> dict:
    for m in curriculum.get("modules", []):
        if m.get("module_id") == module_id:
            return m
    raise HTTPException(status.HTTP_404_NOT_FOUND, "Module not found")


@router.get("/{curriculum_id}")
async def get_curriculum(curriculum_id: str, user: dict = Depends(get_current_user)):
    return _load_curriculum(curriculum_id, user["user_id"])


@router.patch("/{curriculum_id}/modules/{module_id}/complete")
async def complete_module(
    curriculum_id: str,
    module_id: str,
    completed: bool = True,
    user: dict = Depends(get_current_user),
):
    """Progress persistence consumed by the frontend reader.

    When `completed=True`, the next module in sequence (by `order`) is
    automatically unlocked from `locked` → `available` so the learner
    can continue without any manual intervention (Bug Fix: progression).
    """
    curriculum = _load_curriculum(curriculum_id, user["user_id"])
    module = _find_module(curriculum, module_id)
    module["completion"] = 100 if completed else max(module.get("completion", 0), 0)
    module["status"] = "completed" if completed else "in_progress"

    # Auto-unlock the next module in sequence (sorted by `order`).
    next_module: dict | None = None
    if completed:
        modules = curriculum.get("modules", [])
        current_order = module.get("order", 0)
        # Find the module with the immediately next `order` value.
        next_module = next(
            (
                m for m in sorted(modules, key=lambda x: x.get("order", 0))
                if m.get("order", 0) > current_order
            ),
            None,
        )
        if next_module and next_module.get("status") == "locked":
            next_module["status"] = "available"
            log.info(
                "Module %s completed — unlocked next module %s",
                module_id,
                next_module.get("module_id"),
            )

    store = get_store()
    store.table("curricula").update({"modules": curriculum["modules"]}).eq(
        "curriculum_id", curriculum_id
    ).eq("user_id", user["user_id"]).execute()
    return {"ok": True, "module": module, "next_module": next_module if completed else None}


@router.delete("/{curriculum_id}")
async def delete_curriculum(
    curriculum_id: str,
    user: dict = Depends(get_current_user),
):
    """Permanently remove a curriculum and its milestones/modules."""
    _load_curriculum(curriculum_id, user["user_id"])  # 404 when not owned
    store = get_store()
    store.table("curricula").delete().eq(
        "curriculum_id", curriculum_id
    ).eq("user_id", user["user_id"]).execute()
    return {"ok": True, "deleted": curriculum_id}


@router.patch("/{curriculum_id}/status")
async def set_curriculum_status(
    curriculum_id: str,
    new_status: str = "active",
    user: dict = Depends(get_current_user),
):
    """Pause or resume a curriculum. Resuming re-plans the remaining modules
    between today and the deadline (the learner's commitment stands).

    Bug fix: renamed `status` param → `new_status` to avoid shadowing
    the `fastapi.status` module which caused AttributeError on invalid input.
    """
    from fastapi import status as http_status
    if new_status not in ("active", "paused", "completed"):
        raise HTTPException(http_status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid status value — use: active, paused, or completed")
    curriculum = _load_curriculum(curriculum_id, user["user_id"])
    was_paused = curriculum.get("status") == "paused"
    curriculum["status"] = new_status

    message = ""
    if new_status == "active" and was_paused:
        message = _replan_schedule(curriculum)
    store = get_store()
    payload = {"status": curriculum["status"], "modules": curriculum["modules"]}
    try:
        store.table("curricula").update(payload).eq(
            "curriculum_id", curriculum_id
        ).eq("user_id", user["user_id"]).execute()
    except Exception:  # noqa: BLE001 — pre-migration DBs lack the status column
        log.warning("status column missing — run migrations/002_status_and_plan.sql")
        store.table("curricula").update(
            {"modules": curriculum["modules"]}
        ).eq("curriculum_id", curriculum_id).eq("user_id", user["user_id"]).execute()
    return {"ok": True, "status": new_status, "message": message}


def _replan_schedule(curriculum: dict) -> str:
    """Spread unfinished modules evenly between today and the deadline.
    Returns a motivational message for the UI."""
    import math
    from datetime import date, timedelta as _td

    deadline_raw = str(curriculum.get("target_deadline") or "")[:10]
    try:
        deadline = date.fromisoformat(deadline_raw)
    except ValueError:
        return ""
    days_left = max((deadline - date.today()).days, 1)

    remaining = [
        m
        for m in curriculum.get("modules", [])
        if m.get("status") != "completed"
    ]
    if not remaining:
        return (
            f"You're done — everything before {deadline_raw} is complete! "
            "Time to celebrate or start a new goal."
        )

    step = max(days_left / len(remaining), 1)
    week_len = 3  # modules per week bucket, mirrors The Architect
    for i, m in enumerate(remaining):
        offset = int(i * step)
        m["week"] = min(offset // 7 + 1, max(days_left // 7, 1))
        m["day"] = (i % week_len) + 1
        if m.get("status") == "locked":
            if i == 0:
                m["status"] = "available"
        elif i == 0 and m.get("status") == "available":
            pass  # keep it available so the learner can jump straight in

    hours_pw = curriculum.get("hours_per_week", 8) or 8
    topic = curriculum.get("target_topic", "your goal")
    return (
        f"Welcome back! You committed to mastering {topic} by {deadline_raw}. "
        f"With {hours_pw}h/week you have {days_left} days left — your remaining "
        f"{len(remaining)} modules just got re-planned to fit. Pick up where "
        "you left off; momentum beats perfection."
    )


@router.post(
    "/{curriculum_id}/modules/{module_id}/synthesize",
    response_model=SynthesizeResponse,
)
async def synthesize_module(
    curriculum_id: str,
    module_id: str,
    user: dict = Depends(get_current_user),
):
    """Runs the full Hunter -> Synthesizer -> Fact-Checker pipeline,
    including the INSUFFICIENT_DATA → Hunter re-fetch loop (US-013)."""
    from app.agents.fact_checker import fact_checker_node
    from app.agents.supervisor import hunter_node
    from app.agents.synthesizer import synthesizer_node
    from app.services.retrieval import get_retrieval_engine

    curriculum = _load_curriculum(curriculum_id, user["user_id"])
    module = _find_module(curriculum, module_id)
    store = get_store()

    engine = get_retrieval_engine()
    query = " ".join([module.get("title", ""), *(module.get("search_keywords") or [])])
    chunks = await engine.retrieve(query, user_id=user["user_id"])

    state: SyntaxState = {
        "user_id": user["user_id"],
        "current_module": module,
        "retrieved_chunks": [c.__dict__ | {"namespace": c.namespace} for c in chunks],
    }

    async def run_synth() -> dict:
        update = await synthesizer_node(state)
        state.update(update)
        return update

    MAX_ROUNDS = 2  # hunter re-fetch + rewrite budget — keeps latency sane
    for round_no in range(MAX_ROUNDS):
        await run_synth()

        # Insufficient grounding? The Hunter fetches fresh sources (US-008).
        if state.get("draft_content") == "INSUFFICIENT_DATA" or not chunks:
            log.info("Round %d: insufficient data — dispatching The Hunter", round_no)
            hunt_update = await hunter_node(state)
            state.update(hunt_update)
            # Flash occasionally false-flags INSUFFICIENT_DATA even with
            # ample context — give synthesis two chances post-hunt before
            # giving up.
            for _ in range(2):
                await run_synth()
                if state.get("draft_content") != "INSUFFICIENT_DATA":
                    break

        fc_update = await fact_checker_node(state)
        state.update(fc_update)

        if state.get("verification_status") == "passed":
            break
        # Still nothing usable after the Hunter re-fetch? Don't burn more
        # LLM rounds — return the honest INSUFFICIENT_DATA result quickly.
        if state.get("draft_content") == "INSUFFICIENT_DATA":
            break
        if round_no < MAX_ROUNDS - 1:
            log.info("Round %d: verification %s — rewriting",
                     round_no, state.get("verification_status"))

    content = state.get("draft_content", "")
    citations = build_citations_manifest(state)

    module["content_markdown"] = "" if content == "INSUFFICIENT_DATA" else content
    module["citations"] = citations
    module["status"] = "available"
    store.table("curricula").update({"modules": curriculum["modules"]}).eq(
        "curriculum_id", curriculum_id
    ).execute()

    return SynthesizeResponse(
        module_id=module_id,
        status="insufficient_data" if content == "INSUFFICIENT_DATA" else "synthesized",
        verification_status=state.get("verification_status", "pending"),
        content_markdown=module["content_markdown"],
        citations=citations,
        notes=state.get("verification_notes", []),
    )


@router.get("/{curriculum_id}/modules/{module_id}/stream")
async def stream_module_synthesis(
    curriculum_id: str,
    module_id: str,
    user: dict = Depends(get_current_user),
):
    """SSE stream of agent transitions during synthesis (FR-8, US-013).

    Authenticated via the standard Authorization header — the client reads
    the stream with fetch()/ReadableStream, so no token-in-query-string
    leakage into access logs or browser history."""
    # Resolve ownership BEFORE streaming so 401/404 surface as clean HTTP
    # errors instead of a broken event stream.
    curriculum = _load_curriculum(curriculum_id, user["user_id"])
    module = _find_module(curriculum, module_id)

    async def event_source():
        state: SyntaxState = {
            "user_id": user["user_id"],
            "intent": "synthesize",
            "current_module": module,
            "retrieved_chunks": [],
        }
        queue: asyncio.Queue = asyncio.Queue()

        async def runner():
            async for event in run_graph_stream(state):
                await queue.put(event)
            await queue.put(None)

        task = asyncio.create_task(runner())
        while True:
            event = await queue.get()
            if event is None:
                break
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: {\"event\": \"done\"}\n\n"
        task.cancel()

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
