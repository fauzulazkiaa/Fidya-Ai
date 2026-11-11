"""Auth routes — register / login issuing JWTs (NG-3)."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user, rate_limit_auth
from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import create_access_token, hash_password, verify_password
from app.db.supabase_client import get_store
from app.models.schemas import AuthResponse, LoginRequest, RegisterRequest

log = get_logger(__name__, "routes.auth")

router = APIRouter(prefix="/auth", tags=["auth"], dependencies=[Depends(rate_limit_auth)])


def _public_user(row: dict) -> dict:
    return {"id": row["id"], "email": row["email"], "display_name": row.get("display_name", "")}


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest) -> AuthResponse:
    """Create an account and return a bearer token."""
    store = get_store()
    existing = store.table("users").select("*").eq("email", body.email).execute().data
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    inserted = store.table("users").insert(
        {
            "id": uuid.uuid4().hex,
            "email": body.email,
            "password_hash": hash_password(body.password),
            "display_name": body.display_name or body.email.split("@")[0],
        }
    ).execute().data
    if not inserted:
        raise HTTPException(
            status.HTTP_500_INTERNAL_SERVER_ERROR, "Registration failed — try again"
        )
    row = inserted[0]

    token = create_access_token(row["id"], row["email"])
    return AuthResponse(access_token=token, user=_public_user(row))


# Constant-work dummy hash: when the account does not exist we still burn a
# PBKDF2 verification so login timing cannot reveal registered emails.
_DUMMY_HASH = hash_password("timing-equalizer-placeholder")


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest) -> AuthResponse:
    """Check email and password and return a bearer token."""
    store = get_store()
    rows = store.table("users").select("*").eq("email", body.email).execute().data
    if not rows:
        verify_password(body.password, _DUMMY_HASH)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not verify_password(body.password, rows[0]["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    row = rows[0]
    token = create_access_token(row["id"], row["email"])
    return AuthResponse(access_token=token, user=_public_user(row))


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    """Profile of the signed-in identity (plan defaults to free)."""
    store = get_store()
    rows = store.table("users").select("*").eq("id", user["user_id"]).execute().data
    row = rows[0] if rows else {}
    return {
        "id": user["user_id"],
        "email": user.get("email") or row.get("email", ""),
        "display_name": row.get("display_name", ""),
        "plan": row.get("plan", "free"),
        "created_at": row.get("created_at"),
    }


@router.patch("/me")
async def update_me(
    display_name: str = Query(default="", max_length=80),
    user: dict = Depends(get_current_user),
):
    """Persist profile edits from the Settings page."""
    if not display_name.strip():
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "Name required")
    store = get_store()
    try:
        store.table("users").update({"display_name": display_name.strip()}).eq(
            "id", user["user_id"]
        ).execute()
    except Exception:
        # Clerk-managed rows may not exist yet — upsert a minimal record.
        try:
            store.table("users").upsert(
                {
                    "id": user["user_id"],
                    "email": user.get("email") or f"{user['user_id']}@clerk.local",
                    "display_name": display_name.strip(),
                    "password_hash": "-clerk-managed-",
                },
                on_conflict="id",
            ).execute()
        except Exception as exc:  # noqa: BLE001
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Could not save profile")
    return {"ok": True}


VALID_PLANS = ("free", "pro", "team")


@router.patch("/me/plan")
async def update_plan(
    plan: str = "",
    user: dict = Depends(get_current_user),
):
    """Persist plan changes from the Subscribe page (migration 002 required).

    Security (privilege escalation guard): a client must never be able to
    grant itself a PAID plan. Paid upgrades may only be written server-side
    in demo/debug mode; production persists downgrades to free only — the
    client keeps its localStorage mirror so gating/badges keep working."""
    if plan not in VALID_PLANS:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"plan must be one of {', '.join(VALID_PLANS)}",
        )
    store = get_store()
    if plan == "free" or settings.debug:
        try:
            store.table("users").update({"plan": plan}).eq(
                "id", user["user_id"]
            ).execute()
        except Exception as exc:  # noqa: BLE001 — column may not exist yet (002)
            log.warning("Plan update failed (run migration 002?): %s", exc)
    else:
        log.warning(
            "Blocked self-service paid-plan write (%s -> %s) for %s",
            user["user_id"], plan, user.get("email"),
        )
    # Always ok=True: the client mirrors the choice locally either way.
    return {"ok": True, "plan": plan}
