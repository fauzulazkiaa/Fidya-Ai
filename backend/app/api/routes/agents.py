"""Agent interaction routes — Inquisitor chat, Forge review, Catalyst spark."""

import json
import uuid

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.agents.catalyst import catalyst_node
from app.agents.forge_agent import forge_node
from app.api.deps import get_current_user
from app.core.logging import get_logger
from app.db.supabase_client import get_store
from app.models.schemas import (
    CatalystSparkRequest,
    ForgeReviewRequest,
    InquisitorChatRequest,
    InquisitorChatResponse,
)

router = APIRouter(prefix="/agent", tags=["agents"])
log = get_logger(__name__, "routes.agents")


@router.get("/stream")
async def agent_stream(
    curriculum_id: str = "",
    module_id: str = "",
    user: dict = Depends(get_current_user),
):
    """PRD US-013 — generic SSE stream of real-time agent state transitions.

    Runs the full SYNTAX pipeline (Hunter → Synthesizer → Fact-Checker with
    cyclical refinement) for the given module and emits every supervisor
    transition as an SSE event. Authenticated via the Authorization header."""
    from fastapi import HTTPException, status

    from app.agents.supervisor import run_graph_stream
    from app.agents.state import SyntaxState

    if not (curriculum_id and module_id):
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "curriculum_id and module_id are required",
        )

    store = get_store()
    rows = (
        store.table("curricula")
        .select("*")
        .eq("curriculum_id", curriculum_id)
        .eq("user_id", user["user_id"])
        .execute()
        .data
    )
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Curriculum not found")
    module = next(
        (m for m in rows[0]["modules"] if m["module_id"] == module_id), None
    )
    if module is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Module not found")

    state: SyntaxState = {
        "user_id": user["user_id"],
        "intent": "synthesize",
        "current_module": module,
        "retrieved_chunks": [],
    }

    async def event_source():
        async for event in run_graph_stream(state):
            yield _sse(event)
        yield _sse({"event": "done"})

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _sse(event: dict) -> str:
    return f"data: {json.dumps(event)}\n\n"


def _load_module(body: InquisitorChatRequest, user_id: str) -> dict:
    module: dict = {}
    if body.curriculum_id and body.module_id:
        store = get_store()
        curricula = (
            store.table("curricula")
            .select("*")
            .eq("curriculum_id", body.curriculum_id)
            .eq("user_id", user_id)
            .execute()
            .data
        )
        module = next(
            (m for m in curricula[0]["modules"] if m["module_id"] == body.module_id),
            {},
        ) if curricula else {}
    return module


def _build_state(body: InquisitorChatRequest, user_id: str) -> dict:
    return {
        "user_id": user_id,
        "current_module": _load_module(body, user_id),
        "messages": [
            *[{"role": t.role, "content": t.content} for t in body.history],
            {
                "id": f"user-{uuid.uuid4().hex[:6]}",
                "agent": "user",
                "role": "user",
                "content": body.message,
                "mastery": None,
                "hint": None,
            },
        ],
    }


@router.post("/inquisitor/chat", response_model=InquisitorChatResponse)
async def inquisitor_chat(
    body: InquisitorChatRequest,
    user: dict = Depends(get_current_user),
):
    """US-010 — Socratic dialogue grounded in the active module context (FR-5).

    When curriculum_id/module_id are empty the dialogue runs in free-topic
    mode: the learner can explore ANY subject, not just planned modules."""
    from app.agents.inquisitor import inquisitor_node

    state = _build_state(body, user["user_id"])
    update = await inquisitor_node(state)
    reply = update["messages"][0]
    response = InquisitorChatResponse(
        reply=reply["content"],
        mastery=reply.get("mastery") or 3,
        hint=reply.get("hint") or "",
    )

    # Persist the exchange so the learner keeps a full tutoring history.
    _persist_chat(
        user["user_id"],
        body.curriculum_id,
        body.module_id,
        body.session_id,
        [
            {"role": "user", "content": body.message},
            {
                "role": "assistant",
                "agent": "inquisitor",
                "content": response.reply,
                "mastery": response.mastery,
                "hint": response.hint,
            },
        ],
    )
    return response


@router.post("/inquisitor/chat/stream")
async def inquisitor_chat_stream(
    body: InquisitorChatRequest,
    user: dict = Depends(get_current_user),
):
    """Real-time token streaming of The Inquisitor's Socratic reply (FR-8).

    SSE event sequence:
      {"event":"start"}
      {"event":"token","text":"…"}*          — sub-second time-to-first-token
      {"event":"done","reply","mastery","hint"}
    """
    from app.agents.inquisitor import STREAM_SYSTEM_PROMPT, build_prompt, score_streamed_reply
    from app.services.llm import get_llm

    state = _build_state(body, user["user_id"])
    prompt = build_prompt(state)

    async def event_source():
        yield _sse({"event": "start"})
        collected: list[str] = []
        try:
            llm = get_llm(fast=True)
            async for chunk in llm.stream_text(
                prompt, system=STREAM_SYSTEM_PROMPT, temperature=0.5
            ):
                collected.append(chunk)
                yield _sse({"event": "token", "text": chunk})
        except Exception as exc:  # noqa: BLE001
            log.warning("Inquisitor stream failed: %s", exc)
            if not collected:
                yield _sse({"event": "error", "message": "The agent is temporarily unavailable — please try again."})
                return

        reply_text = "".join(collected).strip()
        tail = "\n".join(
            f"{m['role']}: {m['content']}" for m in state["messages"][-6:]
        )
        score = await score_streamed_reply(tail, reply_text)
        response = InquisitorChatResponse(
            reply=reply_text,
            mastery=score.mastery,
            hint=score.hint,
        )

        _persist_chat(
            user["user_id"],
            body.curriculum_id,
            body.module_id,
            body.session_id,
            [
                {"role": "user", "content": body.message},
                {
                    "role": "assistant",
                    "agent": "inquisitor",
                    "content": response.reply,
                    "mastery": response.mastery,
                    "hint": response.hint,
                },
            ],
        )
        yield _sse(
            {
                "event": "done",
                "reply": response.reply,
                "mastery": response.mastery,
                "hint": response.hint,
            }
        )

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def _persist_chat(
    user_id: str,
    curriculum_id: str,
    module_id: str,
    session_id: str,
    turns: list[dict],
):
    """Best-effort persistence of tutor messages (chat_messages table).

    When `session_id` is provided the turn is bound to an explicit session
    row (chat_sessions) so history grouping is exact — no 30-minute gap
    heuristics. Legacy clients without a session_id keep working via the
    time-gap fallback in `inquisitor_history`."""
    import uuid as _uuid

    store = get_store()
    if session_id:
        try:
            first_user = next(
                (t.get("content", "") for t in turns if t.get("role") == "user"),
                "",
            )
            existing = (
                store.table("chat_sessions")
                .select("session_id,title")
                .eq("session_id", session_id)
                .eq("user_id", user_id)
                .execute()
                .data
            )
            if not existing:
                store.table("chat_sessions").insert(
                    {
                        "session_id": session_id,
                        "user_id": user_id,
                        "title": first_user[:80],
                        "curriculum_id": curriculum_id or None,
                        "module_id": module_id or None,
                    }
                ).execute()
            else:
                patch: dict = {"updated_at": _utcnow()}
                if not (existing[0].get("title") or "").strip() and first_user:
                    patch["title"] = first_user[:80]
                store.table("chat_sessions").update(patch).eq(
                    "session_id", session_id
                ).execute()
        except Exception as exc:  # noqa: BLE001 — metadata is best-effort
            log.warning("Chat session upsert failed: %s", exc)

    for turn in turns:
        try:
            store.table("chat_messages").insert(
                {
                    "id": _uuid.uuid4().hex,
                    "user_id": user_id,
                    "curriculum_id": curriculum_id or None,
                    "module_id": module_id or None,
                    "session_id": session_id or None,
                    "role": turn["role"],
                    "agent": turn.get("agent", ""),
                    "content": turn.get("content", ""),
                    "mastery": turn.get("mastery"),
                    "hint": turn.get("hint"),
                }
            ).execute()
        except Exception as exc:  # noqa: BLE001 — history must never break chat
            log.warning("Chat persistence failed: %s", exc)


def _utcnow() -> str:
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


@router.get("/inquisitor/history")
async def inquisitor_history(user: dict = Depends(get_current_user)):
    """Tutor sessions, newest first (pinned sessions float to the top).

    Sessions are explicit (chat_sessions + chat_messages.session_id).
    Legacy rows written before explicit sessions existed are still shown:
    they fall back to the old >30-minute-gap heuristic."""
    store = get_store()

    try:
        meta_rows = (
            store.table("chat_sessions")
            .select("*")
            .eq("user_id", user["user_id"])
            .execute()
            .data
            or []
        )
    except Exception:  # noqa: BLE001
        meta_rows = []

    try:
        rows = (
            store.table("chat_messages")
            .select("*")
            .eq("user_id", user["user_id"])
            .order("created_at", desc=True)
            .limit(600)
            .execute()
            .data
            or []
        )
    except Exception:  # noqa: BLE001
        rows = []
    rows.reverse()

    by_session: dict[str, dict] = {}

    # Explicit sessions.
    for r in rows:
        sid = r.get("session_id")
        if not sid:
            continue
        sess = by_session.setdefault(
            sid,
            {
                "session_key": sid,
                "curriculum_id": r.get("curriculum_id") or "",
                "module_id": r.get("module_id") or "",
                "started_at": (r.get("created_at") or "")[:16],
                "pinned": False,
                "messages": [],
            },
        )
        sess["messages"].append(_msg(r))

    # Legacy rows (no session_id) — group by the historical time-gap rule.
    legacy: list[dict] = []
    current: dict | None = None
    last_ts: str | None = None
    for r in rows:
        if r.get("session_id"):
            continue
        ts = (r.get("created_at") or "")[:19]
        new_session = (
            current is None or not last_ts or not ts or _gap_minutes(last_ts, ts) > 30
        )
        if new_session:
            current = {
                "session_key": f"legacy|{r.get('curriculum_id') or 'free'}|{ts}",
                "curriculum_id": r.get("curriculum_id") or "",
                "module_id": r.get("module_id") or "",
                "started_at": (r.get("created_at") or "")[:16],
                "pinned": False,
                "messages": [],
            }
            legacy.append(current)
        current["messages"].append(_msg(r))
        last_ts = ts
    for s in legacy:
        by_session[s["session_key"]] = s

    # Merge pinned/title metadata; sort pinned first, then by recency.
    meta_by_id = {m.get("session_id"): m for m in meta_rows}
    sessions = list(by_session.values())
    for s in sessions:
        m = meta_by_id.get(s["session_key"])
        if m:
            s["pinned"] = bool(m.get("pinned"))
            if (m.get("title") or "").strip():
                s["title"] = m["title"]
        updated = (m or {}).get("updated_at") if m else None
        s["updated_at"] = (updated or s["started_at"])[:16]

    # Pinned first, then newest first.
    pinned = [s for s in sessions if s["pinned"]]
    rest = [s for s in sessions if not s["pinned"]]
    rest.sort(key=lambda s: s.get("updated_at") or s["started_at"], reverse=True)
    pinned.sort(key=lambda s: s.get("updated_at") or s["started_at"], reverse=True)

    out = []
    for s in [*pinned, *rest][:50]:
        out.append({k: v for k, v in s.items() if k != "updated_at"})
    return {"sessions": out}


def _msg(r: dict) -> dict:
    return {
        "role": r.get("role"),
        "content": r.get("content"),
        "mastery": r.get("mastery"),
    }


def _legacy_filter(store_query, user_id: str, session_id: str):
    """Turn a legacy session key (`legacy|{curriculum}|{ts}`) into row
    filters over the old session-less chat_messages rows."""
    try:
        _, curriculum, ts = session_id.split("|", 2)
    except ValueError:
        return None
    q = store_query.eq("user_id", user_id).is_("session_id", "null")
    if curriculum and curriculum != "free":
        q = q.eq("curriculum_id", curriculum)
    else:
        q = q.is_("curriculum_id", None)
    if ts:
        q = q.like("created_at", f"{ts}%")
    return q


@router.delete("/inquisitor/history/{session_id}")
async def delete_tutor_session(session_id: str, user: dict = Depends(get_current_user)):
    """Delete one tutor conversation permanently.

    Legacy conversations (pre-explicit-sessions, key `legacy|...`) are
    deleted by matching their curriculum + start timestamp instead."""
    store = get_store()
    try:
        if session_id.startswith("legacy|"):
            q = _legacy_filter(
                store.table("chat_messages").delete(), user["user_id"], session_id
            )
            if q is not None:
                q.execute()
        else:
            store.table("chat_messages").delete().eq("session_id", session_id).eq(
                "user_id", user["user_id"]
            ).execute()
            store.table("chat_sessions").delete().eq("session_id", session_id).eq(
                "user_id", user["user_id"]
            ).execute()
    except Exception as exc:  # noqa: BLE001
        log.warning("Session delete failed: %s", exc)
        return {"ok": False}
    return {"ok": True}


@router.patch("/inquisitor/history/{session_id}")
async def pin_tutor_session(
    session_id: str, body: dict, user: dict = Depends(get_current_user)
):
    """Pin / unpin a tutor conversation so it stays at the top of history.

    Pinning a LEGACY conversation first migrates it to an explicit
    `chat_sessions` row (and stamps its messages) so the pin survives."""
    pinned = bool(body.get("pinned"))
    try:
        store = get_store()
        if session_id.startswith("legacy|"):
            existing = (
                store.table("chat_sessions")
                .select("session_id")
                .eq("session_id", session_id)
                .eq("user_id", user["user_id"])
                .execute()
                .data
            )
            if not existing:
                parts = session_id.split("|", 2)
                curriculum = parts[1] if len(parts) > 2 else ""
                store.table("chat_sessions").insert(
                    {
                        "session_id": session_id,
                        "user_id": user["user_id"],
                        "title": "",
                        "curriculum_id": curriculum if curriculum != "free" else None,
                        "pinned": pinned,
                    }
                ).execute()
                mq = _legacy_filter(
                    store.table("chat_messages").update({"session_id": session_id}),
                    user["user_id"],
                    session_id,
                )
                if mq is not None:
                    mq.execute()
            else:
                store.table("chat_sessions").update({"pinned": pinned}).eq(
                    "session_id", session_id
                ).eq("user_id", user["user_id"]).execute()
        else:
            store.table("chat_sessions").update({"pinned": pinned}).eq(
                "session_id", session_id
            ).eq("user_id", user["user_id"]).execute()
    except Exception as exc:  # noqa: BLE001
        log.warning("Session pin failed: %s", exc)
        return {"ok": False}
    return {"ok": True, "pinned": pinned}


def _gap_minutes(prev: str, curr: str) -> float:
    from datetime import datetime as _dt

    try:
        a = _dt.fromisoformat(prev)
        b = _dt.fromisoformat(curr)
        return abs((b - a).total_seconds()) / 60.0
    except ValueError:
        return 999.0


@router.post("/forge/review")
async def forge_review(
    body: ForgeReviewRequest,
    user: dict = Depends(get_current_user),
):
    """US-011 — structured stress-test of any submission.

    `auto` detects the submission kind; `context` ties the critique to the
    topic the learner is currently studying so feedback stays relevant no
    matter what they choose to learn."""
    update = await _run_forge(body)
    return {"review": update["forge_review"]}


async def _run_forge(body: ForgeReviewRequest) -> dict:
    content = body.content.strip()
    if not content:
        from fastapi import HTTPException, status

        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Tulis dulu kode, esai, atau desain yang ingin di-review.",
        )
    state = {
        "active_goal": f"[{body.submission_type.upper()}]"
        + (f" (studying: {body.context})" if body.context else "")
        + f"\n{content}",
    }
    return await forge_node(state)


@router.post("/forge/review/stream")
async def forge_review_stream(
    body: ForgeReviewRequest,
    user: dict = Depends(get_current_user),
):
    """SSE variant of the Forge review (FR-8): agent lifecycle events while
    The Forge stress-tests the submission, then the full review payload."""
    async def event_source():
        yield _sse({"event": "agent_start", "agent": "forge"})
        try:
            update = await _run_forge(body)
        except Exception as exc:  # noqa: BLE001
            log.warning("Forge stream failed: %s", exc)
            yield _sse({"event": "error", "message": "The agent is temporarily unavailable — please try again."})
            return
        yield _sse({"event": "agent_done", "agent": "forge"})
        yield _sse({"event": "result", "review": update["forge_review"]})
        yield _sse({"event": "done"})

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/catalyst/spark")
async def catalyst_spark(
    body: CatalystSparkRequest,
    user: dict = Depends(get_current_user),
):
    """US-012 — cross-disciplinary analogy card."""
    state = {"current_module": {"title": body.concept, "objectives": [body.context]}}
    update = await catalyst_node(state)
    return {"spark": update["catalyst_spark"]}


@router.post("/catalyst/spark/stream")
async def catalyst_spark_stream(
    body: CatalystSparkRequest,
    user: dict = Depends(get_current_user),
):
    """SSE variant of The Catalyst spark (FR-8)."""
    state = {"current_module": {"title": body.concept, "objectives": [body.context]}}

    async def event_source():
        yield _sse({"event": "agent_start", "agent": "catalyst"})
        try:
            update = await catalyst_node(state)
        except Exception as exc:  # noqa: BLE001
            log.warning("Catalyst stream failed: %s", exc)
            yield _sse({"event": "error", "message": "The agent is temporarily unavailable — please try again."})
            return
        yield _sse({"event": "agent_done", "agent": "catalyst"})
        yield _sse({"event": "result", "spark": update["catalyst_spark"]})
        yield _sse({"event": "done"})

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
