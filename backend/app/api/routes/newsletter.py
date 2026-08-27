"""Public newsletter routes — footer / landing subscribe form.

No auth required: this is the public marketing list. Subscribers are stored
in Supabase and receive a warm thank-you email immediately (best-effort;
when SMTP is not configured the send is logged instead)."""

from fastapi import APIRouter, Depends, Request

from app.api.deps import rate_limit_auth
from app.core.config import settings
from app.core.logging import get_logger
from app.db.supabase_client import get_store
from app.models.schemas import NewsletterSubscribeRequest
from app.services.reengagement import send_email

router = APIRouter(prefix="/newsletter", tags=["newsletter"])
log = get_logger(__name__, "routes.newsletter")

WELCOME_SUBJECT = "Welcome to the Fidya inner circle 🎉"

WELCOME_BODY = """Hi there,

Thank you for subscribing — seriously, it means a lot to us.

You're now on the list for product updates, learning-science deep dives,
and early access to new Fidya features. Expect one thoughtful email,
never spam.

While you wait, here's a fun fact: online courses have a completion rate
under 10%. Fidya exists to fix exactly that — curricula engineered around
your deadline, taught only from sources you can verify.

Start your first curriculum anytime: {app_url}

— The Fidya Team
"""


@router.post("/subscribe")
async def subscribe(
    body: NewsletterSubscribeRequest,
    request: Request,
    _: None = Depends(rate_limit_auth),
):
    """Public subscribe with per-IP rate limiting — an open endpoint that
    triggers outbound email must never be an abuse amplifier."""
    email = body.email.strip().lower()
    store = get_store()
    try:
        store.table("newsletter_subscribers").insert(
            {"email": email, "source": body.source or "footer"}
        ).execute()
    except Exception as exc:  # noqa: BLE001 — duplicate subscribe is fine
        log.info("Newsletter insert for %s skipped: %s", email, exc)

    sent = False
    if settings.has_smtp:
        sent = send_email(
            email,
            WELCOME_SUBJECT,
            WELCOME_BODY.format(app_url=settings.app_url),
        )
        if not sent:
            log.warning("Welcome email to %s failed", email)
    else:
        log.info("SMTP not configured — would email welcome to %s", email)

    return {"ok": True, "welcome_email_sent": sent}
