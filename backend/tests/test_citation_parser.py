"""Citation format parser & Synthesizer cleaning tests (US-008, FR-2)."""

import re

import pytest

from app.agents.fact_checker import build_citations_manifest

_CITE = re.compile(r"\[([a-zA-Z0-9_\-]+_p\d+)\]")


def test_citation_regex_matches_prd_format():
    text = "Claim one [karpukhin_2004a9_p1] and claim two [wiki_dense_p12]."
    assert _CITE.findall(text) == ["karpukhin_2004a9_p1", "wiki_dense_p12"]


def test_synthesizer_drops_invalid_chunk_ids():
    from app.agents.synthesizer import synthesizer_node  # noqa: F401

    valid = {"src_abc123_p0"}
    draft = "Good claim [src_abc123_p0]. Fabricated claim [fake_999999_p9]."
    cleaned = re.sub(
        r"\[([a-zA-Z0-9_\-]+_p\d+)\]",
        lambda m: m.group(0) if m.group(1) in valid else "",
        draft,
    )
    assert "[fake_999999_p9]" not in cleaned
    assert "[src_abc123_p0]" in cleaned


@pytest.mark.asyncio
async def test_manifest_maps_indices_and_kinds():
    state = {
        "draft_content": "A [pub_doc_abc_p0] then B [priv_mine_def_p1].",
        "retrieved_chunks": [
            {"chunk_id": "pub_doc_abc_p0", "text": "alpha", "source_title": "Paper",
             "source_url": "https://arxiv.org/x", "author": "A", "namespace": "GLOBAL_KNOWLEDGE"},
            {"chunk_id": "priv_mine_def_p1", "text": "beta", "source_title": "Notes",
             "source_url": "#", "author": "You", "namespace": "NS_user_u1"},
        ],
    }
    manifest = build_citations_manifest(state)
    kinds = {m["chunk_id"]: m["kind"] for m in manifest}
    assert kinds["pub_doc_abc_p0"] == "public"
    assert kinds["priv_mine_def_p1"] == "private"
    assert [m["index"] for m in manifest] == [1, 2]
