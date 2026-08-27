"""The Fact-Checker — post-generation verification guardrail (US-009, FR-2).

Compares every sentence containing a [chunk_id] against the original chunk
text for semantic entailment. Ungrounded claims are stripped or flagged for
a Synthesizer rewrite before anything reaches the client.
"""

from __future__ import annotations

import re

from app.agents.state import SyntaxState
from app.core.logging import get_logger

log = get_logger(__name__, "fact_checker")

_CITE = re.compile(r"\[([a-zA-Z0-9_\-]+_p\d+)\]")
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _token_overlap(a: str, b: str) -> float:
    ta = {w.lower() for w in re.findall(r"[a-z0-9]+", a)}
    tb = {w.lower() for w in re.findall(r"[a-z0-9]+", b)}
    if not ta:
        return 0.0
    return len(ta & tb) / len(ta)


async def fact_checker_node(state: SyntaxState) -> dict:
    """Entailment check: sentence-level lexical entailment against chunks.

    A lightweight scorer stands in for an NLI model offline; when Gemini is
    configured the Synthesizer's strict prompt plus this pass still catches
    dangling / fabricated chunk_ids deterministically.
    """
    draft = state.get("draft_content", "")
    chunks = {c["chunk_id"]: c["text"] for c in state.get("retrieved_chunks") or []}

    notes: list[str] = []
    sentences = _SENTENCE_SPLIT.split(draft)
    kept_sentences: list[str] = []

    cited_count = 0
    stripped_count = 0

    for sentence in sentences:
        tags = _CITE.findall(sentence)
        if not tags:
            stripped = sentence.strip()
            word_count = len(stripped.split())
            # Exempt: markdown headings, list items, blank lines, and short
            # transitional phrases — these are structural, not factual claims.
            is_structural = (
                stripped.startswith("#")          # headings
                or stripped.startswith("-")        # bullet points
                or stripped.startswith("*")        # bullet points / bold
                or stripped.startswith(">")        # blockquotes
                or stripped.startswith("```")      # code fences
                or stripped.startswith("|")        # tables
                or word_count <= 10                # too short to be a factual claim
            )
            if not is_structural and re.search(
                r"\b(is|are|was|were|has|have|outperforms|increases|causes|enables|proves|shows|demonstrates)\b",
                stripped,
            ) and word_count >= 10:
                notes.append(f"Uncited factual sentence dropped: '{stripped[:80]}…'")
                stripped_count += 1
                continue
            kept_sentences.append(sentence)
            continue

        cited_count += 1
        entailed = False
        for tag in tags:
            source_text = chunks.get(tag)
            if not source_text:
                notes.append(f"Dangling citation [{tag}] removed")
                continue
            claim = _CITE.sub("", sentence).strip()
            overlap = _token_overlap(claim, source_text)
            if overlap >= 0.12:  # lenient lexical entailment threshold
                entailed = True
                break
            notes.append(
                f"Low entailment ({overlap:.2f}) for [{tag}]: '{sentence[:80]}…'"
            )
        if entailed:
            kept_sentences.append(sentence)
        else:
            stripped_count += 1

    verified = "\n\n".join(s.strip() for s in kept_sentences if s.strip())

    if stripped_count == 0 and cited_count > 0:
        status = "passed"
    elif not cited_count:
        status = "failed"  # no grounding at all -> reject outright
        notes.append("Draft contained zero valid citations — rejected")
    else:
        status = "rewrite"

    log.info("Fact-checker: %d cited, %d stripped, status=%s", cited_count, stripped_count, status)
    return {
        "draft_content": verified,
        "verification_status": status,
        "verification_notes": notes,
        "active_agent": "synthesizer" if status == "rewrite" else "supervisor",
    }


def build_citations_manifest(state: SyntaxState) -> list[dict]:
    """Map surviving [chunk_id]s to citation objects for the UI (US-008)."""
    draft = state.get("draft_content", "")
    used_ids = list(dict.fromkeys(_CITE.findall(draft)))
    by_id = {c["chunk_id"]: c for c in state.get("retrieved_chunks") or []}
    manifest = []
    for i, cid in enumerate(used_ids, start=1):
        chunk = by_id.get(cid)
        if not chunk:
            continue
        kind = "private" if str(chunk.get("namespace", "")).startswith("NS_user") else "public"
        manifest.append(
            {
                "chunk_id": cid,
                "index": i,
                "source_title": chunk["source_title"],
                "source_url": chunk["source_url"],
                "author": chunk["author"],
                "snippet": chunk["text"][:280],
                "kind": kind,
            }
        )
    return manifest
