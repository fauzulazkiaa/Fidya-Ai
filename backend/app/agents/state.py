"""Centralized LangGraph state schema (US-001, FR-1).

Every agent reads and mutates this shared context. State transitions are
atomic per-node and logged with timestamp + agent ID by the graph runner.
"""

from __future__ import annotations

from typing import Annotated, Any, Literal, TypedDict


def merge_list(existing: list | None, incoming: list) -> list:
    """Reducer: append without duplicating chunk_ids / messages."""
    if existing is None:
        return list(incoming)
    seen = {m.get("id") for m in existing if isinstance(m, dict)}
    return existing + [item for item in incoming if not isinstance(item, dict) or item.get("id") not in seen]


class CitationInfo(TypedDict):
    chunk_id: str
    index: int
    source_title: str
    source_url: str
    author: str
    snippet: str
    kind: str  # "public" | "private"


class AgentMessage(TypedDict):
    id: str
    agent: str
    role: Literal["assistant", "user", "system"]
    content: str
    mastery: int | None
    hint: str | None


class SyntaxState(TypedDict, total=False):
    # Identity & goal
    user_id: str
    active_goal: str

    # Curriculum (written by The Architect)
    curriculum: dict[str, Any]
    current_module: dict[str, Any]

    # Conversation (The Inquisitor)
    messages: Annotated[list[AgentMessage], merge_list]

    # Retrieval (The Hunter + engine)
    search_keywords: list[str]
    retrieved_chunks: list[dict[str, Any]]

    # Generation (The Synthesizer)
    draft_content: str

    # Verification (The Fact-Checker)
    verification_status: Literal["pending", "passed", "rewrite", "failed"]
    verification_notes: list[str]

    # Review (The Forge)
    forge_review: dict[str, Any] | None

    # Inspiration (The Catalyst)
    catalyst_spark: dict[str, Any] | None

    # Routing (Supervisor)
    intent: Literal[
        "generate",
        "synthesize",
        "inquisitor",
        "forge",
        "catalyst",
    ]
    rewrite_attempts: int
    active_agent: Literal[
        "supervisor",
        "architect",
        "hunter",
        "synthesizer",
        "fact_checker",
        "inquisitor",
        "forge",
        "catalyst",
        "__end__",
    ]
