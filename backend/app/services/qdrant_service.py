"""Qdrant vector store with strict namespace isolation.

Collections: a single `fidya_knowledge_base` collection; tenancy is enforced
through payload `namespace` filtering:

    GLOBAL_KNOWLEDGE          — public peer-reviewed / open educational data
    NS_user_{user_id}         — private BYOD documents (US-020)

FR-4  : every point payload preserves chunk_id, source_title, source_url,
        author, namespace, paragraph_idx and created_at.
FR-6  : retrieval is hard-filtered on namespace — cross-tenant leakage is
        impossible because the filter is applied server-side at query time.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client import models as qm

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__, "qdrant")

COLLECTION = "fidya_knowledge_base"
GLOBAL_KNOWLEDGE = "GLOBAL_KNOWLEDGE"
VECTOR_SIZE = 768  # text-embedding-004 dimensionality
PAYLOAD_SCHEMA = (
    "chunk_id",
    "source_title",
    "source_url",
    "author",
    "namespace",
    "paragraph_idx",
    "created_at",
)

_QDRANT_RETRIES = 3
_QDRANT_BACKOFF = 0.6  # seconds; doubles per retry


async def _with_retry(op, *args, **kwargs):
    """Run a (sync) Qdrant operation off the event loop with retries (US-002).

    Transient network / timeout failures are retried with exponential
    backoff; the synchronous client call is wrapped in asyncio.to_thread so
    large upserts never block the API's event loop."""
    last_exc: Exception | None = None
    for attempt in range(_QDRANT_RETRIES):
        if attempt:
            await asyncio.sleep(_QDRANT_BACKOFF * 2 ** (attempt - 1))
        try:
            return await asyncio.to_thread(op, *args, **kwargs)
        except Exception as exc:  # noqa: BLE001 — retry transport-level errors
            last_exc = exc
            log.warning("Qdrant attempt %d/%d failed: %s", attempt + 1, _QDRANT_RETRIES, exc)
    raise RuntimeError(f"Qdrant operation failed after {_QDRANT_RETRIES} attempts") from last_exc


def user_namespace(user_id: str) -> str:
    """Private payload namespace for one user (``NS_user_{id}``)."""
    return f"NS_user_{user_id}"


@lru_cache
def get_qdrant() -> QdrantClient:
    """Shared client. Uses ``QDRANT_URL``, or ``:memory:`` when it is empty."""
    if settings.qdrant_url:
        log.info("Connecting to Qdrant at %s", settings.qdrant_url)
        client: QdrantClient = QdrantClient(
            url=settings.qdrant_url, api_key=settings.qdrant_api_key or None, timeout=10
        )
    else:
        log.warning("QDRANT_URL missing — using in-memory local mode")
        client = QdrantClient(":memory:")
    _ensure_collection(client)
    return client


def _ensure_collection(client: QdrantClient) -> None:
    if not client.collection_exists(COLLECTION):
        client.create_collection(
            collection_name=COLLECTION,
            vectors_config=qm.VectorParams(
                size=VECTOR_SIZE, distance=qm.Distance.COSINE
            ),
        )
        client.create_payload_index(
            collection_name=COLLECTION,
            field_name="namespace",
            field_schema=qm.PayloadSchemaType.KEYWORD,
        )
        log.info("Created collection %s", COLLECTION)


class VectorStore:
    """Thin service wrapper around the raw Qdrant client."""

    def __init__(self, client: QdrantClient | None = None) -> None:
        self.client = client or get_qdrant()

    # ------------------------------------------------------------------ write
    async def upsert_chunks(
        self,
        chunks: list[dict[str, Any]],
        vectors: list[list[float]],
        namespace: str,
    ) -> int:
        """Write chunks and vectors into one namespace. Returns the point count."""
        assert len(chunks) == len(vectors), "chunks/vectors length mismatch"
        points = [
            qm.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload={
                    **chunk,
                    "namespace": namespace,
                    "created_at": chunk.get("created_at")
                    or datetime.now(timezone.utc).isoformat(),
                },
            )
            for chunk, vector in zip(chunks, vectors)
        ]
        await _with_retry(
            lambda: self.client.upsert(collection_name=COLLECTION, points=points)
        )
        log.info("Upserted %d chunks into %s", len(points), namespace)
        return len(points)

    # ------------------------------------------------------------------- read
    async def search(
        self,
        query_vector: list[float],
        namespaces: list[str],
        top_k: int | None = None,
    ) -> list[dict[str, Any]]:
        """Vector similarity search restricted to the given namespaces."""
        top_k = top_k or settings.retrieval_top_k
        flt = qm.Filter(
            must=[
                qm.FieldCondition(
                    key="namespace",
                    match=qm.MatchAny(any=namespaces),
                )
            ]
        )
        hits = (
            await _with_retry(
                lambda: self.client.query_points(
                    collection_name=COLLECTION,
                    query=query_vector,
                    query_filter=flt,
                    limit=top_k,
                    with_payload=True,
                )
            )
        ).points
        results = []
        for h in hits:
            payload = dict(h.payload or {})
            payload["score"] = h.score
            results.append(payload)
        return results


@lru_cache
def get_vector_store() -> VectorStore:
    """Cached store around :func:`get_qdrant`."""
    return VectorStore()
