"""Re-engagement service — motivational nudges for learners who drifted away.

A background sweep (scheduled in main.py) checks each user's last learning
activity and, after a configurable number of silent days, sends a short
motivational email whose tone adapts to how long they have been gone:

  day 2  — gentle streak reminder
  day 4  — progress recap ("you already made it this far")
  day 7  — one-week mark: restart small
  day 14 — two weeks: deadline pressure + re-planning offer
  day 30 — one month: fresh start, no guilt

Emails are deduplicated per (user, bucket) via analytics_events so a user is
nudged at most once per milestone of absence. When SMTP is not configured the
sweep only logs what it *would* send — useful for local development.
"""

import smtplib
from datetime import date, datetime, timedelta
from email.message import EmailMessage

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__, "services.reengagement")

LEARNING_EVENTS = {"module_complete", "module_study", "tutor_session", "forge_review"}

# days_inactive -> (subject template, body template)
COPY: dict[int, tuple[str, str]] = {
    2: (
        "Your {topic} streak is waiting 🔥",
        "Hi {name},\n\n"
        "Yesterday you were pushing through \"{topic}\" — don't let the momentum slip "
        "today. One module (~{hours} minutes of focus) keeps your streak alive.\n\n"
        "Small daily reps beat heroic weekend marathons. See you inside.\n\n"
        "— The Fidya Agents",
    ),
    4: (
        "You're {pct}% done with {topic} — keep going",
        "Hi {name},\n\n"
        "Quick recap: you've already completed {done} of {total} modules on "
        "\"{topic}\". That progress doesn't expire — but your deadline "
        "({deadline}) is getting closer.\n\n"
        "Pick up exactly where you stopped; your next module is ready.\n\n"
        "— The Fidya Agents",
    ),
    7: (
        "One week away from {topic}. Restart small.",
        "Hi {name},\n\n"
        "It's been a week since your last session. That's okay — life happens.\n"
        "The trick to coming back: lower the bar. Do ONE 15-minute review today, "
        "just to rebuild the habit. The Architect will handle the rest of the plan.\n\n"
        "Your syllabus for \"{topic}\" hasn't moved an inch. It's waiting.\n\n"
        "— The Fidya Agents",
    ),
    14: (
        "Two weeks out — should we re-plan {topic}?",
        "Hi {name},\n\n"
        "Two weeks of silence, and your deadline for \"{topic}\" is {deadline}.\n"
        "Here's the good news: you don't have to abandon it. Hit Resume and The "
        "Architect will compress and re-plan every remaining module around the "
        "time you have left.\n\n"
        "Commitments survive pauses. Come back and finish what you started.\n\n"
        "— The Fidya Agents",
    ),
    30: (
        "Fresh start with {topic}? No guilt attached.",
        "Hi {name},\n\n"
        "It's been a month. Whatever pulled you away — that's fine.\n"
        "If \"{topic}\" still matters to you, just log in: your progress is saved "
        "and you can either continue where you left off or archive it and start "
        "something that fits your life today.\n\n"
        "The best time to restart was yesterday. The second best is now.\n\n"
        "— The Fidya Agents",
    ),
}

# Buckets fire when inactivity reaches EXACTLY these days (checked every sweep).
BUCKETS = sorted(COPY)


def _bucket_for(days_inactive: int) -> int | None:
    """Largest copy-bucket that matches this level of inactivity."""
    hit = None
    for b in BUCKETS:
        if days_inactive >= b:
            hit = b
    return hit


def compose_email(bucket: int, name: str, topic: str, hours: float,
                  done: int, total: int, deadline: str) -> tuple[str, str]:
    subject_tpl, body_tpl = COPY[bucket]
    return (
        subject_tpl.format(topic=topic),
        body_tpl.format(
            name=name or "there",
            topic=topic or "your goal",
            hours=int(max(hours * 60 / 8, 15)),  # rough per-module minutes
            pct=round(done / max(total, 1) * 100),
            done=done,
            total=total,
            deadline=deadline or "soon",
        ),
    )


def send_email(to: str, subject: str, body: str) -> bool:
    """Send via SMTP. Returns False (and logs) when SMTP isn't configured."""
    # Header-injection guard: recipient/subject must never contain CR/LF.
    to = " ".join(str(to).split())
    subject = " ".join(str(subject).split())
    if not settings.has_smtp:
        log.info("SMTP not configured — would email %s: %s", to, subject)
        return False
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from
    msg["To"] = to
    msg.set_content(body)
    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as s:
            s.starttls()
            if settings.smtp_user:
                s.login(settings.smtp_user, settings.smtp_password)
            s.send_message(msg)
        return True
    except Exception as exc:  # noqa: BLE001 — never crash the sweep
        log.warning("Email to %s failed: %s", to, exc)
        return False


def run_reengagement_sweep() -> dict:
    """Scan users and nudge the inactive ones. Returns stats for logging.

    Users are capped per cycle (oldest-checked first is not tracked; the cap
    simply bounds a single sweep's runtime) — with hundreds of accounts the
    sequential per-user queries must never run unbounded."""
    if not settings.reengagement_enabled:
        return {"skipped": True}
    from app.db.supabase_client import get_background_store

    MAX_USERS_PER_SWEEP = 200
    store = get_background_store()
    users = (
        store.table("users")
        .select("id,email,display_name")
        .limit(MAX_USERS_PER_SWEEP)
        .execute().data
        or []
    )
    sent = skipped = errors = 0

    # Pre-fetch already-sent buckets: analytics_events type="reengagement_email".
    already = set()
    events = (
        store.table("analytics_events")
        .select("user_id,meta")
        .eq("type", "reengagement_email")
        .execute()
        .data
        or []
    )
    for e in events:
        # meta is stored as "{bucket}:{timestamp}" — dedupe on the bucket part.
        bucket_part = str(e.get("meta") or "").split(":", 1)[0]
        already.add((e.get("user_id"), bucket_part))

    curricula = (
        store.table("curricula").select("user_id,target_topic,hours_per_week,"
                                        "modules,target_deadline,status")
        .execute().data
        or []
    )
    by_user: dict[str, list[dict]] = {}
    for c in curricula:
        by_user.setdefault(c.get("user_id"), []).append(c)

    today = date.today()
    for u in users:
        uid = u["id"]
        rows = (
            store.table("analytics_events")
            .select("created_at,type")
            .eq("user_id", uid)
            .order("created_at", desc=True)
            .limit(50)
            .execute().data
            or []
        )
        learning_days = {
            (r.get("created_at") or "")[:10]
            for r in rows
            if r.get("type") in LEARNING_EVENTS
        }
        if not learning_days:
            continue  # never engaged — welcome flow handles these
        last_day = date.fromisoformat(max(learning_days))
        days_inactive = (today - last_day).days
        if days_inactive < BUCKETS[0]:
            continue

        bucket = _bucket_for(days_inactive)
        if bucket is None or (uid, str(bucket)) in already:
            continue

        active = [c for c in by_user.get(uid, []) if c.get("status") != "paused"]
        target = active[0] if active else (by_user.get(uid) or [{}])[0]
        mods = target.get("modules") or []
        done = sum(1 for m in mods if m.get("status") == "completed")
        subject, body = compose_email(
            bucket=bucket,
            name=u.get("display_name", ""),
            topic=target.get("target_topic", ""),
            hours=target.get("hours_per_week") or 6,
            done=done,
            total=len(mods),
            deadline=str(target.get("target_deadline") or ""),
        )
        ok = send_email(u["email"], subject, body)
        if ok or not settings.has_smtp:
            store.table("analytics_events").insert(
                {"user_id": uid, "type": "reengagement_email",
                 "meta": f"{bucket}:{datetime.now().isoformat()}"}
            ).execute()
            sent += 1
        else:
            errors += 1
    return {"sent": sent, "errors": errors, "scanned": len(users), "skipped": False}


async def sweep_loop() -> None:
    """Background loop started from the FastAPI lifespan.

    Waits one full interval BEFORE the first sweep: at startup the API must
    serve requests immediately, not compete with a full-table scan."""
    import asyncio

    interval = max(settings.reengagement_interval_hours, 1) * 3600
    while True:
        await asyncio.sleep(interval)
        try:
            stats = await asyncio.to_thread(run_reengagement_sweep)
            if stats and not stats.get("skipped"):
                log.info("Re-engagement sweep: %s", stats)
        except Exception as exc:  # noqa: BLE001
            log.warning("Re-engagement sweep failed: %s", exc)
