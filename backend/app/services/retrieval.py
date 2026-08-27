"""Dual-stage retrieval engine (US-006, FR-3, US-020, FR-6).

    Stage 1 — vector similarity search over Qdrant (Top-K candidates)
              restricted to [user namespace, GLOBAL_KNOWLEDGE].
    Stage 2 — cross-encoder / Vertex re-ranking down to Top-N, discarding
              anything below RELEVANCE_THRESHOLD. BYOD chunks from
              NS_user_{id} receive a priority boost (US-020): personal
              documents must outrank public sources on ties/near-ties.
"""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from app.core.config import settings
from app.core.logging import get_logger
from app.services.llm import embed_texts
from app.services.qdrant_service import GLOBAL_KNOWLEDGE, VectorStore, get_vector_store, user_namespace
from app.services.reranker import Reranker, get_reranker

log = get_logger(__name__, "retrieval")

# US-020 — private documents take priority in RAG. A multiplicative bump on
# the rerank score lets a personal doc beat a near-equal public source while
# still losing to a genuinely far-more-relevant global chunk.
_PRIVATE_BOOST = 1.15


@dataclass
class RetrievedChunk:
    chunk_id: str
    text: str
    source_title: str
    source_url: str
    author: str
    namespace: str
    score: float

    def as_citation(self) -> dict:
        return {
            "chunk_id": self.chunk_id,
            "source_title": self.source_title,
            "source_url": self.source_url,
            "author": self.author,
            "snippet": self.text[:280],
        }


class RetrievalEngine:
    def __init__(self, store: VectorStore | None = None, reranker: Reranker | None = None) -> None:
        self.store = store or get_vector_store()
        self.reranker = reranker or get_reranker()

    async def retrieve(
        self,
        query: str,
        *,
        user_id: str | None = None,
        top_n: int | None = None,
    ) -> list[RetrievedChunk]:
        namespaces = (
            [user_namespace(user_id), GLOBAL_KNOWLEDGE]
            if user_id
            else [GLOBAL_KNOWLEDGE]
        )

        # ---- Stage 1: semantic vector search ------------------------------
        vectors = await embed_texts([query])
        candidates = await self.store.search(
            query_vector=vectors[0], namespaces=namespaces, top_k=settings.retrieval_top_k
        )
        log.info("Stage 1 retrieved %d candidates", len(candidates))

        # ---- Stage 2: re-rank + threshold (private-first, US-020) ---------
        ranked = await self.reranker.rerank(query, candidates, top_n=top_n)
        for c in ranked:
            if str(c.get("namespace", "")).startswith("NS_user"):
                c["rerank_score"] = min(
                    1.0, c.get("rerank_score", c.get("score", 0.0)) * _PRIVATE_BOOST
                )

        results = [
            RetrievedChunk(
                chunk_id=c["chunk_id"],
                text=c["text"],
                source_title=c["source_title"],
                source_url=c["source_url"],
                author=c["author"],
                namespace=c["namespace"],
                score=c.get("rerank_score", c.get("score", 0.0)),
            )
            for c in ranked
        ]
        log.info("Stage 2 kept %d grounded chunks", len(results))
        return results


@lru_cache(maxsize=1)
def get_retrieval_engine() -> RetrievalEngine:
    return RetrievalEngine()
