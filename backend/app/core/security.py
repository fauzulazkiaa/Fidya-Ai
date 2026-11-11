"""JWT auth helpers (NG-3: standard email/password for MVP).

Password hashing uses PBKDF2-HMAC-SHA256 from the standard library so no
native build dependencies are required.
"""

import hashlib
import hmac
import secrets
import time
from typing import Any

import jwt

from app.core.config import settings

_ALGO = "HS256"


def hash_password(password: str) -> str:
    """PBKDF2-HMAC-SHA256 hash, stored as ``pbkdf2$salt$digest``."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return f"pbkdf2${salt}${digest.hex()}"


def verify_password(password: str, hashed: str) -> bool:
    """Constant-time check of a hash from :func:`hash_password`."""
    try:
        _, salt, expected = hashed.split("$")
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000)
    return hmac.compare_digest(digest.hex(), expected)


def create_access_token(user_id: str, email: str) -> str:
    """HS256 JWT for the legacy email/password login path."""
    now = int(time.time())
    payload: dict[str, Any] = {
        "sub": user_id,
        "email": email,
        "iat": now,
        "exp": now + settings.jwt_expires_minutes * 60,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=_ALGO)


def decode_token(token: str) -> dict[str, Any] | None:
    """Return JWT claims, or None when the token is invalid or expired."""
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[_ALGO])
    except jwt.PyJWTError:
        return None
