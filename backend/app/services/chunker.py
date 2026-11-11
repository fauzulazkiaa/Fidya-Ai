"""Hierarchical semantic chunking with unique chunk-ID injection (US-005).

Strategy:
    1. Split on markdown headings (h1-h3) to respect document hierarchy.
    2. Split each section into paragraph blocks.
    3. Merge small paragraphs up to ~MAX_TOKENS; split oversized ones with
       TOKEN_OVERLAP continuity.
    4. Emit deterministic IDs: {source_slug}_{hash6}_p{paragraph_idx}

Every chunk retains full source metadata for citation traceability (FR-4).
"""

from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

MAX_TOKENS = 420
TOKEN_OVERLAP = 50

_HEADING = re.compile(r"^#{1,3}\s+", re.MULTILINE)
_PARAGRAPH_SPLIT = re.compile(r"\n\s*\n")


def _token_len(text: str) -> int:
    """Approximate token count (~4 chars/token heuristic)."""
    return max(1, len(text) // 4)


@dataclass
class RawDocument:
    source_title: str
    source_url: str
    author: str
    text: str
    published_at: str | None = None


def slugify(title: str) -> str:
    """Turn a source title into a short hyphenated id prefix."""
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return slug[:48] or "source"


def chunk_document(doc: RawDocument) -> list[dict]:
    """Chunk one document into citation-traceable pieces."""
    sections = _split_sections(doc.text)
    chunks: list[dict] = []
    paragraph_idx = 0
    slug = slugify(doc.source_title)

    for section_text in sections:
        if not section_text.strip():
            continue
        for piece in _split_with_overlap(section_text):
            digest = hashlib.sha256(piece.encode()).hexdigest()[:6]
            chunks.append(
                {
                    "chunk_id": f"{slug}_{digest}_p{paragraph_idx}",
                    "text": piece,
                    "source_title": doc.source_title,
                    "source_url": doc.source_url,
                    "author": doc.author,
                    "paragraph_idx": paragraph_idx,
                    "published_at": doc.published_at,
                }
            )
            paragraph_idx += 1
    return chunks


def chunk_documents(docs: list[RawDocument]) -> list[dict]:
    """Chunk a batch and suffix ids that would otherwise collide."""
    all_chunks: list[dict] = []
    for doc in docs:
        all_chunks.extend(chunk_document(doc))
    # Guarantee global ID uniqueness across the ingestion batch.
    seen: set[str] = set()
    for chunk in all_chunks:
        base = chunk["chunk_id"]
        candidate, suffix = base, 1
        while candidate in seen:
            candidate = f"{base}_{suffix}"
            suffix += 1
        chunk["chunk_id"] = candidate
        seen.add(candidate)
    return all_chunks


# --------------------------------------------------------------------- internals
def _split_sections(text: str) -> list[str]:
    """Split on headings, keeping heading text attached to its body."""
    parts = _HEADING.split(text)
    if len(parts) == 1:
        return [text]
    headings = _HEADING.findall(text)
    sections: list[str] = []
    for i, part in enumerate(parts):
        if i == 0 and part.strip():
            sections.append(part)
        elif i > 0:
            sections.append(f"{headings[i - 1].strip()} {part}".strip())
    return sections


def _split_with_overlap(section_text: str) -> list[str]:
    paragraphs = [p.strip() for p in _PARAGRAPH_SPLIT.split(section_text) if p.strip()]

    merged: list[str] = []
    buffer = ""
    for para in paragraphs:
        if _token_len(para) > MAX_TOKENS:
            # Hard-split oversized paragraphs with overlap.
            words = para.split()
            step = MAX_TOKENS * 4 - TOKEN_OVERLAP * 4
            window = MAX_TOKENS * 4
            start = 0
            while start < len(words):
                merged.append(" ".join(words[start : start + window]))
                if start + window >= len(words):
                    break
                start += step
            buffer = ""
            continue

        candidate = f"{buffer}\n\n{para}".strip() if buffer else para
        if _token_len(candidate) <= MAX_TOKENS:
            buffer = candidate
        else:
            if buffer:
                merged.append(buffer)
            buffer = para
    if buffer:
        merged.append(buffer)

    # Add trailing overlap between consecutive merged chunks.
    if len(merged) <= 1 or TOKEN_OVERLAP == 0:
        return merged
    overlapped = [merged[0]]
    for prev, cur in zip(merged, merged[1:]):
        tail_words = prev.split()[-TOKEN_OVERLAP * 4 :]
        head_words = cur.split()
        overlapped.append(" ".join([*tail_words[: TOKEN_OVERLAP * 2], *head_words]))
    return overlapped
