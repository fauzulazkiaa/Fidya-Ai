"""Fact-checker guardrail tests — must catch all ungrounded claims (US-009)."""

import pytest

from app.agents.fact_checker import fact_checker_node


def _state(draft: str, chunks: list[dict]) -> dict:
    return {
        "draft_content": draft,
        "retrieved_chunks": [
            {"chunk_id": "src_abc123_p0", "text": t, "source_title": "S",
             "source_url": "u", "author": "a", "namespace": "GLOBAL_KNOWLEDGE"}
            for t in chunks
        ],
        "verification_notes": [],
    }


@pytest.mark.asyncio
async def test_grounded_citations_pass():
    draft = (
        "Dense retrieval uses vector similarity search [src_abc123_p0].\n\n"
        "# Overview\nThis section covers retrieval."
    )
    result = await fact_checker_node(
        _state(draft, ["Dense retrieval uses vector similarity search over embeddings."])
    )
    assert result["verification_status"] == "passed"


@pytest.mark.asyncio
async def test_dangling_citation_is_caught():
    draft = "The moon is made of cheese [fake_nonexist_p9]."
    result = await fact_checker_node(_state(draft, ["Irrelevant chunk text."]))
    assert result["verification_status"] in ("rewrite", "failed")
    assert any("Dangling" in n for n in result["verification_notes"])


@pytest.mark.asyncio
async def test_zero_citations_fails_hard():
    draft = "Completely ungrounded factual claim without any citations at all here."
    result = await fact_checker_node(_state(draft, ["Something unrelated."]))
    assert result["verification_status"] == "failed"
    assert result["active_agent"] == "supervisor"


@pytest.mark.asyncio
async def test_uncited_factual_sentence_dropped():
    draft = (
        "Vector databases store embeddings efficiently [src_abc123_p0]. "
        "The Eiffel Tower was built in 1887 and nobody cited this claim."
    )
    result = await fact_checker_node(
        _state(draft, ["Vector databases store embeddings efficiently."])
    )
    joined = "\n\n".join(
        s for s in result.get("draft_content", "").split("\n\n")
    )
    # The ungrounded factual sentence must actually be pruned (FR-2).
    assert "Eiffel" not in joined
    assert result["verification_notes"]
