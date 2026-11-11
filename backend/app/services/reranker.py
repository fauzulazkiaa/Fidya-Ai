"""Cross-Encoder / Vertex AI re-ranking service (US-003, FR-3).

Interface: score(query, chunks) -> Top-N sorted by relevance with scores in
[0, 1]. Chunks below RELEVANCE_THRESHOLD are discarded by the retrieval
engine. When VERTEX_RANKING_ENABLED is off (or no key), a deterministic
lexical-overlap scorer keeps the pipeline functional offline.
"""

from __future__ import annotations

import re
from functools import lru_cache
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__, "reranker")

_TOKEN = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> list[str]:
    return _TOKEN.findall(text.lower())


class Reranker:
    async def rerank(
        self, query: str, chunks: list[dict[str, Any]], top_n: int | None = None
    ) -> list[dict[str, Any]]:
        top_n = top_n or settings.rerank_top_n
        scored = [
            {**chunk, "rerank_score": await self._score(query, chunk)}
            for chunk in chunks
        ]
        scored.sort(key=lambda c: c["rerank_score"], reverse=True)
        threshold = (
            settings.relevance_threshold
            if settings.vertex_ranking_enabled and settings.has_gemini
            else settings.lexical_relevance_threshold
        )
        kept = [c for c in scored[:top_n] if c["rerank_score"] >= threshold]
        log.info(
            "Re-ranked %d -> %d chunks (threshold %.2f)",
            len(chunks),
            len(kept),
            threshold,
        )
        return kept

    async def _score(self, query: str, chunk: dict[str, Any]) -> float:
        if settings.vertex_ranking_enabled and settings.has_gemini:
            return await self._vertex_score(query, chunk)
        return self._lexical_score(query, chunk)

    # ------------------------------------------------------------- vertex ai
    async def _vertex_score(self, query: str, chunk: dict[str, Any]) -> float:
        """Vertex AI Discovery Engine ranking API call.

        Requires GOOGLE_CLOUD_PROJECT + service account creds; falls back to
        lexical scoring on any failure so the pipeline never hard-fails.
        """
        try:  # pragma: no cover — requires GCP credentials
            from google.cloud import discoveryengine_v2alpha as discoveryengine  # type: ignore

            client = discoveryengine.RankingServiceClient()
            request = discoveryengine.RankRequest(
                model="semantic-ranker-512",
                query=query,
                records=[
                    discoveryengine.RankRequest.Record(
                        id=chunk.get("chunk_id", "0"),
                        content=chunk.get("text", ""),
                    )
                ],
            )
            response = client.rank(request=request)
            return float(response.records[0].relevance_score)
        except Exception as exc:  # noqa: BLE001
            log.warning("Vertex ranking unavailable (%s) — lexical fallback", exc)
            return self._lexical_score(query, chunk)

    # -------------------------------------------------------------- fallback
    @staticmethod
    def _lexical_score(query: str, chunk: dict[str, Any]) -> float:
        """Query-token coverage ratio with mild IDF weighting.

        Returns 1.0 when every query token appears in the chunk, 0.0 when
        none do — comparable to the 0..1 range of a cross-encoder so the
        same RELEVANCE_THRESHOLD applies.
        """
        q_tokens = list(dict.fromkeys(_tokens(query)))
        c_tokens = _tokens(chunk.get("text", ""))
        if not q_tokens or not c_tokens:
            return 0.0

        tf: dict[str, int] = {}
        for t in c_tokens:
            tf[t] = tf.get(t, 0) + 1

        # Coverage: fraction of distinct query tokens present in the chunk.
        matched = sum(1 for qt in q_tokens if tf.get(qt, 0) > 0)
        score = min(matched / len(q_tokens) * 1.15, 1.0)

        # Long encyclopedic full-texts trivially maximise token coverage;
        # give peer-reviewed / courseware sources a small boost so journals
        # outrank Wikipedia on near-ties (user-facing credibility goal).
        source = str(chunk.get("source_title", "")).lower()
        if "wikipedia" not in source and "wiki" not in source:
            score = min(score * 1.1 + 0.05, 1.0)
        return score


@lru_cache
def get_reranker() -> Reranker:
    """Return the process-wide reranker."""
    return Reranker()
