"""Shared route dependencies: auth (Clerk JWT + legacy demo JWT) & rate limit."""

import time
from collections import defaultdict, deque

import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.logging import get_logger
from app.core.security import decode_token

log = get_logger(__name__, "auth")

bearer = HTTPBearer(auto_error=False)

_jwk_client = None


def _clerk_verifier() -> "jwt.PyJWKClient | None":
    """Lazily create a JWKS client for Clerk session-token verification."""
    global _jwk_client
    jwks_url = settings.clerk_jwks
    if not jwks_url:
        return None
    if _jwk_client is None:
        _jwk_client = jwt.PyJWKClient(jwks_url, cache_keys=True)
    return _jwk_client


def _verify_clerk_token(token: str) -> dict | None:
    verifier = _clerk_verifier()
    if not verifier:
        return None
    try:
        signing_key = verifier.get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        sub = claims.get("sub")
        if not sub:
            return None
        email = claims.get("email")
        # Full name claims when the provider supplies them (Google sign-in).
        name = (
            claims.get("name")
            or " ".join(
                p
                for p in [claims.get("given_name"), claims.get("family_name")]
                if p
            ).strip()
        )
        return {
            "user_id": sub,
            "email": email or f"{sub}@clerk.local",
            "name": name,
            "_clerk": True,
        }
    except jwt.PyJWTError as exc:
        log.info("Clerk token rejected: %s", exc)
        return None


async def _sync_clerk_user(user: dict) -> None:
    """Ensure the Clerk identity exists in our users table (FK integrity).

    Insert-only: an existing row is never touched, otherwise the real name
    captured at Google sign-up would be clobbered by the email prefix on
    every single request."""
    try:
        from app.db.supabase_client import get_store

        store = get_store()
        existing = (
            store.table("users")
            .select("id")
            .eq("id", user["user_id"])
            .execute()
            .data
        )
        if existing:
            return
        display_name = user.get("name") or (user.get("email") or "").split("@")[0]
        store.table("users").insert(
            {
                "id": user["user_id"],
                "email": user["email"],
                "display_name": display_name,
                "password_hash": "-clerk-managed-",
            }
        ).execute()
    except Exception as exc:  # noqa: BLE001 — never block a valid session
        log.warning("Clerk user sync failed: %s", exc)


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    """Authenticate via Clerk session token (production). The legacy
    internal demo JWT is accepted ONLY when Clerk is not configured on the
    backend (local dev) — with Clerk live, a forgeable HS256 token must
    never authenticate."""
    if creds is None or not creds.credentials:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    token = creds.credentials

    # 1) Clerk session token (required in production).
    clerk_claims = _verify_clerk_token(token)
    if clerk_claims:
        await _sync_clerk_user(clerk_claims)
        return {
            "user_id": clerk_claims["user_id"],
            "email": clerk_claims["email"],
        }

    # 2) Legacy internal JWT — dev/demo convenience only. Rejected whenever
    # it could be forgeable: production (debug off) still running on the
    # default secret must never accept HS256 tokens.
    legacy_allowed = settings.debug or settings.jwt_secret != "dev-secret-change-me"
    if settings.clerk_jwks and not legacy_allowed:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    payload = decode_token(token)
    if payload and legacy_allowed:
        return {"user_id": payload["sub"], "email": payload.get("email", "")}

    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")


# ------------------------------------------------------------------ rate limit
_RATE_LIMIT_WINDOW = 60.0  # seconds
_RATE_LIMIT_MAX = 10  # requests per window per IP
_MAX_BUCKETS = 5_000  # bound memory against IP-spoofing floods
_hits: dict[str, deque[float]] = defaultdict(deque)


def rate_limit_auth(request: Request) -> None:
    """Simple sliding-window limiter protecting credential endpoints.
    Buckets are keyed per IP *and* path so login attempts never exhaust
    the register quota (and vice versa)."""
    ip = request.client.host if request.client else "unknown"
    key = f"{request.url.path}:{ip}"
    now = time.monotonic()
    if len(_hits) >= _MAX_BUCKETS and key not in _hits:
        # Bound memory against floods: drop stale buckets, then hard-reset.
        for k in [k for k, b in _hits.items() if not b or now - b[0] > _RATE_LIMIT_WINDOW]:
            del _hits[k]
        if len(_hits) >= _MAX_BUCKETS:
            _hits.clear()
    bucket = _hits[key]
    while bucket and now - bucket[0] > _RATE_LIMIT_WINDOW:
        bucket.popleft()
    if len(bucket) >= _RATE_LIMIT_MAX:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many attempts — try again in a minute",
        )
    bucket.append(now)
