"""The Synthesizer — strict citation prompting & module compiler (US-008, FR-2).

Hard rules baked into the system prompt:
    * Every factual claim MUST end with an inline `[chunk_id]` tag.
    * If retrieved context is insufficient the node returns INSUFFICIENT_DATA
      instead of fabricating content — routing back to The Hunter.
"""

from __future__ import annotations

from app.agents.state import SyntaxState
from app.core.logging import get_logger
from app.services.llm import get_llm

log = get_logger(__name__, "synthesizer")

SYSTEM_PROMPT = """You are The Synthesizer of the Fidya education platform.

ABSOLUTE RULES:
1. Every factual claim in the lesson MUST end with an inline citation tag
   like [chunk_id] referencing one of the provided chunks. Example:
   "Dense retrieval outperforms BM25 on passage recall [karpukhin_2004a9_p1]."
2. NEVER state a factual claim without a citation tag. No exceptions.
3. Use ONLY the information present in the provided chunks. Do not add
   outside knowledge.
4. Only reply with exactly "INSUFFICIENT_DATA" (and nothing else) when the
   provided chunks clearly cannot teach the module at all (e.g. fewer than
   two topically relevant chunks). If several chunks are on-topic, you MUST
   write the lesson using them instead.

Output well-structured markdown: headings, short paragraphs, bullet lists
for objectives."""


async def synthesizer_node(state: SyntaxState) -> dict:
    llm = get_llm(fast=True)
    chunks = state.get("retrieved_chunks") or []
    module = state.get("current_module", {})
    objectives = "\n".join(f"- {o}" for o in module.get("objectives", []))

    context_block = "\n\n---\n\n".join(
        f"[{c['chunk_id']}] ({c['source_title']} — {c['author']}):\n{c['text']}"
        for c in chunks
    )
    if not context_block.strip():
        log.info("No retrieved chunks — flagging INSUFFICIENT_DATA")
        return {"draft_content": "INSUFFICIENT_DATA", "active_agent": "hunter"}

    prompt = f"""Module title: {module.get('title', 'Untitled')}
Learning objectives:
{objectives}

Retrieved chunks (cite these chunk_ids):
{context_block}

Write the lesson now."""
    draft = await llm.generate_text(prompt, system=SYSTEM_PROMPT, temperature=0.3)

    if "INSUFFICIENT_DATA" in draft[:200]:
        log.info("Synthesizer flagged insufficient data — routing to Hunter")
        return {"draft_content": "INSUFFICIENT_DATA", "active_agent": "hunter"}

    # Strip any [chunk_id] tags that do not exist in retrieved chunks —
    # first-line defense before the Fact-Checker runs.
    valid_ids = {c["chunk_id"] for c in chunks}
    import re

    def _drop_invalid(match: re.Match) -> str:
        tag = match.group(1)
        return match.group(0) if tag in valid_ids else ""

    cleaned = re.sub(r"\[([a-zA-Z0-9_\-]+_p\d+)\]", _drop_invalid, draft)

    # Normalize comma-separated citations "[a_p1, b_p2]" → "[a_p1] [b_p2]"
    multi = re.compile(
        r"\[([a-zA-Z0-9_\-]+_p\d+(?:\s*,\s*[a-zA-Z0-9_\-]+_p\d+)+)\]"
    )

    def _split_multi(match: re.Match) -> str:
        ids = [i.strip() for i in match.group(1).split(",") if i.strip() in valid_ids]
        return " ".join(f"[{i}]" for i in ids)

    cleaned = multi.sub(_split_multi, cleaned)

    # The model sometimes appends a literal hedge token; strip it anywhere.
    cleaned = cleaned.replace("INSUFFICIENT_DATA", "").rstrip()
    log.info("Synthesized %d chars with %d valid citations",
             len(cleaned), len(re.findall(r"\[[^\]]+\]", cleaned)))
    return {"draft_content": cleaned, "verification_status": "pending"}
