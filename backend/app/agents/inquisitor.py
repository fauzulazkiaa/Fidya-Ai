"""The Inquisitor — Socratic assessor (US-010, FR-5).

Never reveals answers directly; formulates probing questions, identifies
logical gaps, and scores conceptual mastery 1-5 with targeted hints.
"""

from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.agents.state import SyntaxState
from app.core.logging import get_logger
from app.services.llm import get_llm

log = get_logger(__name__, "inquisitor")

SYSTEM_PROMPT = """You are The Inquisitor of the Fidya education platform.

HARD CONSTRAINT (FR-5): You NEVER provide direct answers to homework or
conceptual questions. Instead you:
1. Ask probing Socratic questions that expose the learner's assumptions.
2. Point out logical gaps or fallacies in their reasoning.
3. When the learner is stuck after 2 attempts, provide a *hint* — never the
   answer.
4. Rate their conceptual mastery 1 (lost) to 5 (mastered) on each reply.

Keep responses under 120 words. One question at a time."""

# Variant for the SSE token-streaming path where the reply is plain prose:
# mastery scores and hints are reported separately via the scoring pass.
STREAM_SYSTEM_PROMPT = SYSTEM_PROMPT + """
Output ONLY your spoken Socratic response as flowing text. Never include
mastery ratings, numeric scores, labels like 'Mastery:' or 'Hint:', or any
metadata — those are assessed separately."""


class InquisitorReply(BaseModel):
    reply: str = Field(description="Socratic question or hint")
    mastery: int = Field(ge=1, le=5, description="Mastery score 1-5")
    hint: str = ""


class MasteryHint(BaseModel):
    """Post-hoc scoring of an already-streamed Socratic reply."""
    mastery: int = Field(ge=1, le=5, description="Mastery score 1-5")
    hint: str = Field(default="", description="Targeted hint if learner is stuck")


def build_prompt(state: SyntaxState) -> str:
    """Shared prompt assembly for the blocking node and the SSE stream."""
    module = state.get("current_module", {})
    history = state.get("messages", [])[-12:]
    transcript = "\n".join(f"{m['role']}: {m['content']}" for m in history)

    objectives = module.get("objectives") or []
    if module.get("title"):
        context = f"""Active module: {module['title']}
Objectives:
{chr(10).join(objectives)}"""
    else:
        context = (
            "Active module: (none — free-topic mode). Anchor the dialogue to "
            "whatever subject the learner is exploring in this conversation."
        )

    return f"""{context}

Conversation so far:
{transcript}

Respond with your next Socratic move."""


async def inquisitor_node(state: SyntaxState) -> dict:
    """Ask one Socratic follow-up and attach a 1–5 mastery score."""
    llm = get_llm(fast=True)
    result = await llm.generate_structured(
        prompt=build_prompt(state),
        schema=InquisitorReply,
        system=SYSTEM_PROMPT,
        temperature=0.5,
    )
    log.info("Inquisitor replied (mastery=%d)", result.mastery)
    return {
        "messages": [
            {
                "id": f"inquisitor-{uuid.uuid4().hex[:8]}",
                "agent": "inquisitor",
                "role": "assistant",
                "content": result.reply,
                "mastery": result.mastery,
                "hint": result.hint,
            }
        ],
        "active_agent": "supervisor",
    }


async def score_streamed_reply(transcript_tail: str, reply: str) -> MasteryHint:
    """Cheap second pass scoring the learner AFTER the reply has streamed."""
    llm = get_llm(fast=True)
    try:
        return await llm.generate_structured(
            prompt=f"""Conversation tail:
{transcript_tail}

Inquisitor's latest reply:
{reply}

Score the LEARNER's conceptual mastery and give a targeted hint (empty
string if they are progressing well).""",
            schema=MasteryHint,
            system=SYSTEM_PROMPT,
            temperature=0.2,
        )
    except Exception as exc:  # noqa: BLE001 — never break chat over scoring
        log.warning("Mastery scoring failed: %s", exc)
        return MasteryHint(mastery=3, hint="")
