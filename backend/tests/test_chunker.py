"""Chunker unit tests — boundaries, ID determinism, metadata (US-005)."""

from app.services.chunker import RawDocument, chunk_document, chunk_documents, slugify


def _doc(text: str) -> RawDocument:
    return RawDocument(
        source_title="Dense Passage Retrieval",
        source_url="https://arxiv.org/abs/2004.04906",
        author="Karpukhin et al.",
        text=text,
        published_at="2020-04-09",
    )


def test_chunk_ids_are_deterministic():
    doc = _doc("Alpha paragraph.\n\nBeta paragraph.\n\nGamma paragraph.")
    a = chunk_document(doc)
    b = chunk_document(doc)
    assert [c["chunk_id"] for c in a] == [c["chunk_id"] for c in b]


def test_chunk_id_format():
    doc = _doc("Some content here.")
    chunks = chunk_document(doc)
    assert len(chunks) == 1
    cid = chunks[0]["chunk_id"]
    assert cid.startswith("dense-passage-retrieval_")
    assert "_p0" in cid
    # hash segment is 6 hex chars
    seg = cid.split("_")[1]
    assert len(seg) == 6 and all(ch in "0123456789abcdef" for ch in seg)


def test_metadata_retained():
    doc = _doc("Content body.")
    chunk = chunk_document(doc)[0]
    assert chunk["source_title"] == "Dense Passage Retrieval"
    assert chunk["source_url"] == "https://arxiv.org/abs/2004.04906"
    assert chunk["author"] == "Karpukhin et al."
    assert chunk["paragraph_idx"] == 0


def test_heading_split_keeps_hierarchy():
    doc = _doc("# Intro\nIntro body.\n\n## Deep Dive\nDeep body.")
    chunks = chunk_document(doc)
    texts = " ".join(c["text"] for c in chunks)
    assert "# Intro" in texts or "Intro body" in texts
    assert any(c["paragraph_idx"] > 0 for c in chunks)


def test_global_uniqueness_across_docs():
    d = _doc("Same title duplicate.\n\nSecond para.")
    docs = [d, d]
    chunks = chunk_documents(docs)
    ids = [c["chunk_id"] for c in chunks]
    assert len(ids) == len(set(ids))


def test_slugify():
    assert slugify("Hello, World! 123") == "hello-world-123"
