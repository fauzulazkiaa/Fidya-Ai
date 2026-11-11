"""Analytics routes — completion, streak & citation telemetry.

All numbers are derived from real user activity:
- streak: consecutive days with at least one tracked learning event
- velocity: hours logged per day over the last 7 days
- mastery: average Inquisitor score per module (chat_messages table)
"""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.db.supabase_client import get_store
from app.models.schemas import (
    MasteryPoint,
    ProgressResponse,
    VelocityPoint,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])

_LEARNING_EVENTS = {"module_complete", "module_study", "tutor_session", "forge_review"}


def _compute_streak(event_dates: set[str]) -> int:
    """Longest run of consecutive days ending today or yesterday."""
    if not event_dates:
        return 0
    today = date.today()
    days = {date.fromisoformat(d) for d in event_dates if d}
    streak = 0
    cursor = today if today in days else today - timedelta(days=1)
    if cursor not in days:
        return 0
    while cursor in days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


@router.get("/progress", response_model=ProgressResponse)
async def progress(user: dict = Depends(get_current_user)) -> ProgressResponse:
    """Aggregate completion, streak, and mastery for the signed-in user."""
    store = get_store()
    curricula = (
        store.table("curricula").select("*").eq("user_id", user["user_id"]).execute().data
    )
    modules_total = sum(len(c.get("modules", [])) for c in curricula)
    modules_done = sum(
        1
        for c in curricula
        for m in c.get("modules", [])
        if m.get("status") == "completed"
    )
    hours_studied = sum(
        m.get("estimated_hours", 0) * (m.get("completion", 0) / 100)
        for c in curricula
        for m in c.get("modules", [])
    )

    events = (
        store.table("analytics_events")
        .select("*")
        .eq("user_id", user["user_id"])
        .execute()
        .data
    )
    citation_clicks = sum(1 for e in events if e.get("type") == "citation_click")

    # --- streak: consecutive learning days ---------------------------------
    event_dates = {
        (e.get("created_at") or "")[:10] for e in events if e.get("type") in _LEARNING_EVENTS
    }
    streak_days = _compute_streak(event_dates)

    # --- velocity: hours per day, last 7 days ------------------------------
    now = datetime.now()
    per_day: dict[str, float] = {}
    for e in events:
        if e.get("type") not in _LEARNING_EVENTS:
            continue
        day = (e.get("created_at") or "")[:10]
        try:
            # meta may be a raw hour value or a "{bucket}:{timestamp}" marker
            # written by the re-engagement sweep — only parse the numeric part.
            meta_hours = float(str(e.get("meta") or 0).split(":", 1)[0])
        except (TypeError, ValueError):
            meta_hours = 0.5  # default credit for a logged session
        per_day[day] = per_day.get(day, 0.0) + max(meta_hours, 0.25)
    velocity = []
    for i in range(6, -1, -1):
        day = (now - timedelta(days=i)).date().isoformat()
        velocity.append(
            VelocityPoint(
                label=(now - timedelta(days=i)).strftime("%a"),
                hours=round(min(per_day.get(day, 0.0), 12.0), 1),
            )
        )

    # --- mastery: avg Inquisitor score per module ---------------------------
    mastery_raw: dict[str, tuple[float, int]] = {}
    try:
        chats = (
            store.table("chat_messages")
            .select("curriculum_id,module_id,mastery")
            .eq("user_id", user["user_id"])
            .execute()
            .data
        )
    except Exception:  # noqa: BLE001 — table may be missing in old deployments
        chats = []
    title_by_key: dict[tuple[str, str], str] = {
        (c.get("curriculum_id", ""), m.get("module_id", "")): m.get("title", "Module")
        for c in curricula
        for m in c.get("modules", [])
    }
    agg: dict[tuple[str, str], list[int]] = {}
    for ch in chats:
        if ch.get("mastery"):
            key = (ch.get("curriculum_id") or "", ch.get("module_id") or "")
            agg.setdefault(key, []).append(ch["mastery"])
    for key, scores in agg.items():
        concept = title_by_key.get(key) or "Free-topic chat"
        mastery_raw[concept] = (sum(scores) / len(scores), len(scores))
    mastery = [
        MasteryPoint(concept=k, score=round(v[0], 1))
        for k, v in sorted(mastery_raw.items(), key=lambda kv: -kv[1][1])[:6]
    ]

    overall = (modules_done / modules_total * 100) if modules_total else 0.0
    return ProgressResponse(
        streak_days=streak_days,
        overall_completion=round(overall, 1),
        modules_completed=modules_done,
        modules_total=modules_total,
        hours_studied=round(hours_studied, 1),
        citation_clicks=citation_clicks,
        velocity=velocity,
        mastery=mastery,
    )


@router.post("/events")
async def track_event(user: dict = Depends(get_current_user), type: str = "", meta: str = ""):
    """Lightweight telemetry sink (e.g. citation_click for KPI tracking).

    Length-capped: unbounded client-supplied strings here would let a
    logged-in account bloat the events table (storage DoS) and pollute
    every downstream consumer of `meta`."""
    if not type or len(type) > 40:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Invalid event type")
    store = get_store()
    store.table("analytics_events").insert(
        {"user_id": user["user_id"], "type": type, "meta": meta[:200]}
    ).execute()
    return {"ok": True}


@router.get("/notifications")
async def notifications(user: dict = Depends(get_current_user)):
    """Real notifications derived from the learner's own data."""
    store = get_store()
    curricula = (
        store.table("curricula").select("*").eq("user_id", user["user_id"]).execute().data
    )
    events = (
        store.table("analytics_events")
        .select("*")
        .eq("user_id", user["user_id"])
        .order("created_at", desc=True)
        .limit(30)
        .execute()
        .data
    )

    items: list[dict] = []
    today = date.today()

    # Deadline & milestone alerts per curriculum
    for c in curricula:
        deadline = c.get("target_deadline") or ""
        try:
            dl = date.fromisoformat(str(deadline)[:10])
        except ValueError:
            continue
        days_left = (dl - today).days
        done = sum(1 for m in c.get("modules", []) if m.get("status") == "completed")
        total = len(c.get("modules", [])) or 1
        topic = c.get("target_topic", "Curriculum")
        status = c.get("status", "active")

        if status == "paused":
            items.append({
                "kind": "paused",
                "title": f"Paused: {topic}",
                "desc": f"You committed to finish by {deadline}. Resume to stay on track.",
                "date": deadline,
            })
        elif days_left < 0:
            items.append({
                "kind": "deadline",
                "title": f"Deadline passed: {topic}",
                "desc": f"{done}/{total} modules done. Resume and let The Architect re-plan.",
                "date": deadline,
            })
        elif days_left <= 7:
            items.append({
                "kind": "deadline",
                "title": f"{days_left} day{'s' if days_left != 1 else ''} left: {topic}",
                "desc": f"{done}/{total} modules done — keep your commitment.",
                "date": deadline,
            })
        for ms in (c.get("milestones") or [])[:4]:
            try:
                ms_date = date.fromisoformat(str(ms.get("date", ""))[:10])
            except ValueError:
                continue
            delta = (ms_date - today).days
            if 0 <= delta <= 7:
                items.append({
                    "kind": "milestone",
                    "title": ms.get("title", "Milestone"),
                    "desc": f"{topic} · due {ms_date.strftime('%b %d')}",
                    "date": ms["date"],
                })

    # Recent completions from telemetry
    for e in events:
        if e.get("type") == "module_complete":
            items.append({
                "kind": "done",
                "title": "Module completed",
                "desc": e.get("meta") or "Nice work.",
                "date": (e.get("created_at") or "")[:10],
            })

    items.sort(key=lambda x: x.get("date") or "", reverse=True)

    # --- re-engagement nudge: days since the last tracked activity ----------
    learning_dates = [
        (e.get("created_at") or "")[:10]
        for e in events
        if e.get("type") in _LEARNING_EVENTS
    ]
    if learning_dates:
        try:
            last = date.fromisoformat(max(learning_dates))
        except ValueError:
            last = None
    else:
        last = None
    if last is not None:
        away = (today - last).days
        if away >= 2:
            topic = curricula[0].get("target_topic", "your goal") if curricula else "your goal"
            if away >= 30:
                title, desc = (
                    f"{away} days away — ready for a fresh start?",
                    f"No guilt: \"{topic}\" is saved exactly where you left it. "
                    "Restarting is one click away.",
                )
            elif away >= 14:
                title, desc = (
                    f"{away} days out — let's re-plan {topic}",
                    "Hit Resume and The Architect will fit every remaining "
                    "module into the time you still have.",
                )
            elif away >= 7:
                title, desc = (
                    "A week without practice — restart small",
                    f"Just one 15-minute review of \"{topic}\" today rebuilds "
                    "the habit. Small reps beat marathons.",
                )
            else:
                title, desc = (
                    "Don't break your momentum",
                    f"You were close to a breakthrough on \"{topic}\". "
                    "One module today keeps the streak alive.",
                )
            items.insert(0, {
                "kind": "reengage",
                "title": title,
                "desc": desc,
                "date": last.isoformat(),
            })

    return {"notifications": items[:15]}
