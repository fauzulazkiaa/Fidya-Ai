"""FastAPI application entrypoint (US-001).

Configured with CORS, /api/v1/health endpoint and structured logging.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import agents, analytics, auth, curriculum, documents, newsletter
from app.core.config import settings
from app.core.logging import get_logger, setup_logging
from app.core.net import prefer_ipv4

# Must run before any outbound client (Supabase/Gemini/Qdrant) is created —
# see app/core/net.py for why.
prefer_ipv4()

log = get_logger("fidya", "system")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    # Refuse to boot production with the forgeable default JWT secret.
    if not settings.debug and not settings.clerk_jwks and settings.jwt_secret == "dev-secret-change-me":
        raise RuntimeError(
            "Refusing to start: JWT_SECRET is the default value in a "
            "non-debug deployment without Clerk. Set JWT_SECRET or configure Clerk."
        )
    if not settings.debug and settings.clerk_jwks is None:
        log.warning("Running without Clerk — legacy HS256 auth is active (dev only)")
    log.info("%s starting — gemini=%s qdrant=%s supabase=%s",
             settings.app_name,
             settings.has_gemini,
             settings.qdrant_url or "in-memory",
             settings.has_supabase or "in-memory")

    # Background re-engagement email sweep (no-op unless SMTP is configured).
    reengage_task = None
    if settings.reengagement_enabled and settings.has_supabase:
        import asyncio

        from app.services.reengagement import sweep_loop

        reengage_task = asyncio.create_task(sweep_loop())

    yield

    if reengage_task:
        reengage_task.cancel()
    log.info("%s shutting down", settings.app_name)


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
    # Interactive API docs expose the full attack surface — keep them for
    # local development only.
    docs_url="/docs" if settings.debug else None,
    redoc_url=None,
    openapi_url="/openapi.json" if settings.debug else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Log every unhandled 500 with a traceback + correlation id, and return
    a generic body so internals never leak to the client."""
    import uuid

    req_id = uuid.uuid4().hex[:8]
    log.error("Unhandled error [%s] %s %s: %r",
              req_id, request.method, request.url.path, exc)
    log.error("Traceback [%s]:", req_id, exc_info=exc)
    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error [ref: {req_id}]"},
    )

API = "/api/v1"
app.include_router(auth.router, prefix=API)
app.include_router(curriculum.router, prefix=API)
app.include_router(agents.router, prefix=API)
app.include_router(documents.router, prefix=API)
app.include_router(analytics.router, prefix=API)
app.include_router(newsletter.router, prefix=API)


@app.get(f"{API}/health")
async def health():
    return {
        "status": "ok",
        "gemini": settings.has_gemini,
        "qdrant": settings.qdrant_url or "in-memory",
        "supabase": settings.has_supabase or "in-memory",
    }
