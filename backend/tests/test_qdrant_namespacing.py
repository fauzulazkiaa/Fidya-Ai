"""Qdrant namespace isolation tests (US-002, US-020, FR-6)."""

import pytest

from app.services.qdrant_service import (
    GLOBAL_KNOWLEDGE,
    VectorStore,
    user_namespace,
)


@pytest.fixture
def store() -> VectorStore:
    # Fresh in-memory instance per test (bypasses the lru_cache singleton).
    return VectorStore(client=None) if False else VectorStore.__new__(VectorStore)


def _make_store() -> VectorStore:
    from qdrant_client import QdrantClient
    from app.services.qdrant_service import _ensure_collection

    client = QdrantClient(":memory:")
    _ensure_collection(client)
    return VectorStore(client=client)


@pytest.mark.asyncio
async def test_namespace_isolation():
    vs = _make_store()
    chunk_a = {
        "chunk_id": "docA_111111_p0", "text": "private secret data",
        "source_title": "My notes", "source_url": "#", "author": "You",
        "paragraph_idx": 0,
    }
    chunk_b = {
        "chunk_id": "docB_222222_p0", "text": "public knowledge data",
        "source_title": "arXiv paper", "source_url": "https://arxiv.org",
        "author": "Researcher", "paragraph_idx": 0,
    }
    await vs.upsert_chunks([chunk_a], [[1.0] * 768], user_namespace("user_1"))
    await vs.upsert_chunks([chunk_b], [[0.5] * 768], GLOBAL_KNOWLEDGE)

    # User 2 querying their own namespace must NOT see user 1's private docs.
    hits_user2 = await vs.search([1.0] * 768, [user_namespace("user_2")])
    assert all(h["chunk_id"] != "docA_111111_p0" for h in hits_user2)

    # Global queries must not leak private namespaces either.
    hits_global = await vs.search([1.0] * 768, [GLOBAL_KNOWLEDGE])
    assert all(h["namespace"] == GLOBAL_KNOWLEDGE for h in hits_global)


@pytest.mark.asyncio
async def test_payload_schema_preserved():
    vs = _make_store()
    chunk = {
        "chunk_id": "docC_333333_p0", "text": "payload integrity check",
        "source_title": "T", "source_url": "u", "author": "a",
        "paragraph_idx": 3,
    }
    await vs.upsert_chunks([chunk], [[0.9] * 768], GLOBAL_KNOWLEDGE)
    hits = await vs.search([0.9] * 768, [GLOBAL_KNOWLEDGE])
    hit = next(h for h in hits if h["chunk_id"] == "docC_333333_p0")
    for field in ("chunk_id", "source_title", "source_url", "author",
                  "namespace", "paragraph_idx", "created_at"):
        assert field in hit, f"FR-4 payload field missing: {field}"


@pytest.mark.asyncio
async def test_user_namespace_format():
    assert user_namespace("abc") == "NS_user_abc"
