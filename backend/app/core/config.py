"""Centralized settings loaded from environment / .env file."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "Fidya API"
    debug: bool = True
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Auth
    jwt_secret: str = "dev-secret-change-me"
    jwt_expires_minutes: int = 60 * 24 * 7

    # Clerk (frontend identity provider)
    clerk_publishable_key: str = ""  # pk_live_… / pk_test_…
    clerk_jwks_url: str = ""  # override; derived from publishable key if empty

    @property
    def clerk_issuer(self) -> str | None:
        """Derive the Clerk issuer URL from the publishable key.

        The key embeds the reversed API domain, optionally followed by '$'
        and instance metadata: base64("<reversed-domain>$...").
        """
        import base64

        if self.clerk_jwks_url:
            return self.clerk_jwks_url.removesuffix("/.well-known/jwks.json")
        key = self.clerk_publishable_key
        if not key or "_" not in key:
            return None
        try:
            b64 = key.split("_", 2)[2].split("$")[0]
            raw = base64.b64decode(b64 + "==").decode("utf-8")
            # Newer keys embed the plain domain followed by '$<instance-b64>';
            # older ones embed it reversed. Detect by TLD sanity check.
            candidate = raw.split("$")[0]
            if candidate.endswith(("dev", "com", "app", "io", "clerk.accounts")):
                domain = candidate
            else:
                domain = candidate[::-1]
            return f"https://{domain}"
        except Exception:  # noqa: BLE001
            return None

    @property
    def clerk_jwks(self) -> str | None:
        """JWKS URL for Clerk session tokens, or None when Clerk is unset."""
        issuer = self.clerk_issuer
        return f"{issuer}/.well-known/jwks.json" if issuer else None

    # Supabase & DB
    supabase_url: str = ""
    supabase_publishable_key: str = ""  # sb_publishable_… (client-safe)
    supabase_secret_key: str = ""  # sb_secret_… (server-only, replaces legacy service_role)
    supabase_service_key: str = ""  # legacy alias, still accepted
    supabase_jwks_url: str = ""
    database_url: str = ""
    db_host: str = ""
    db_port: int = 6543
    db_name: str = "postgres"
    db_user: str = ""


    @property
    def supabase_server_key(self) -> str:
        """The key used server-side: new secret key or legacy service role."""
        return self.supabase_secret_key or self.supabase_service_key

    @property
    def has_supabase(self) -> bool:
        """True when both a Supabase URL and a server key are set."""
        return bool(self.supabase_url and self.supabase_server_key)

    # Qdrant
    qdrant_url: str = ""  # empty -> in-memory local mode
    qdrant_api_key: str = ""

    # Re-engagement emails (motivational nudges for inactive learners)
    app_url: str = "http://localhost:3000"
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "Fidya <noreply@fidya.ai>"
    reengagement_enabled: bool = True
    reengagement_interval_hours: int = 6

    @property
    def has_smtp(self) -> bool:
        """True when re-engagement mail has a host and a From address."""
        return bool(self.smtp_host and self.smtp_from)

    # Gemini / Vertex
    google_api_key: str = ""
    gemini_model: str = "gemini-1.5-pro"
    gemini_flash_model: str = "gemini-1.5-flash"
    embedding_model: str = "models/text-embedding-004"
    vertex_ranking_enabled: bool = False

    # Retrieval tuning (FR-3)
    retrieval_top_k: int = 20
    rerank_top_n: int = 5
    relevance_threshold: float = 0.75
    # The 0.75 FR-3 threshold is calibrated for cross-encoder scores. The
    # lexical-overlap fallback produces systematically lower values, so it is
    # gated by its own (lower) threshold to avoid discarding every chunk.
    lexical_relevance_threshold: float = 0.3

    @property
    def cors_origin_list(self) -> list[str]:
        """``CORS_ORIGINS`` split on commas."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def has_gemini(self) -> bool:
        """True when ``GOOGLE_API_KEY`` is set; otherwise agents use MockLLM."""
        return bool(self.google_api_key)


@lru_cache
def get_settings() -> Settings:
    """Process-wide settings, cached after the first environment read."""
    return Settings()


settings = get_settings()
