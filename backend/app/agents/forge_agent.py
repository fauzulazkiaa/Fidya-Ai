"""The Forge — project & output stress-tester (US-011).

Reviews code / essays / designs / arguments / anything a learner produces
and returns structured critique with line-level annotations and exact diff
recommendations. Fully flexible: rubric adapts to the submission type
detected so The Forge is equally useful for math, writing, code, or design.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator
from typing import Any

from app.agents.state import SyntaxState
from app.core.logging import get_logger
from app.services.llm import get_llm

log = get_logger(__name__, "forge")

SYSTEM_PROMPT = """You are The Forge of the Fidya education platform — a
ruthless but constructive stress-testing agent. You review ANY kind of
learner output: code, essays, math proofs, design docs, arguments, plans,
creative writing — anything.

STEP 1 — Detect the submission kind (unless the header specifies it).
Valid kinds: code, essay, math, design, argument, plan, creative, other.

STEP 2 — Select the 5 most appropriate rubric categories for that kind:
• code      → Correctness, Robustness, Readability, Performance, Testability
• essay     → Argumentation, Evidence, Clarity, Structure, Originality
• math      → Correctness, Rigor, Completeness, Notation, Efficiency
• design    → Feasibility, Scalability, UX, Trade-offs, Innovation
• argument  → Logic, Evidence, Counter-argument, Clarity, Persuasiveness
• plan      → Feasibility, Completeness, Risk-awareness, Clarity, Actionability
• creative  → Originality, Coherence, Craft, Voice, Resonance
• other     → Clarity, Completeness, Correctness, Relevance, Depth

STEP 3 — Return structured JSON:
- detected_kind: the detected submission kind (one word).
- summary: 2-3 sentence overall assessment.
- strengths: concrete things done well (at least 1).
- vulnerabilities: specific weaknesses with line/paragraph anchors where possible.
- suggested_refactors: MANDATORY — provide at least 2 concrete rewrites.
  Each has a short `title` and `diff` containing an exact before/after
  snippet of the affected content (- old / + new). Never leave this list
  empty; if the submission is excellent, propose hardening or edge-case
  improvements instead.
- rubric_scores: MANDATORY — score ALL five categories chosen in STEP 2
  out of 10. Include `name` (the category name) and `score`. Never return
  an empty rubric.

If a "studying:" topic is given, connect the critique to that subject so
feedback reinforces what the learner is working on.

Be specific. Quote exact lines or phrases. No generic advice."""


class Vulnerability(BaseModel):
    line: int | None = None
    paragraph: int | None = None
    note: str


class Refactor(BaseModel):
    title: str
    diff: str


class RubricScore(BaseModel):
    name: str
    score: int = Field(ge=0, le=10)
    max: int = 10

    @field_validator("score", mode="before")
    @classmethod
    def _coerce_score(cls, v: Any) -> Any:
        """Models sometimes emit '7/10' or prose — extract the leading int."""
        if isinstance(v, str):
            import re as _re

            m = _re.search(r"\d+", v)
            return int(m.group()) if m else 0
        return v


class ForgeReview(BaseModel):
    detected_kind: str = "auto"
    summary: str
    strengths: list[str] = Field(default_factory=list)
    vulnerabilities: list[Vulnerability] = Field(default_factory=list)
    suggested_refactors: list[Refactor] = Field(default_factory=list)
    rubric_scores: list[RubricScore] = Field(default_factory=list)


async def forge_node(state: SyntaxState) -> dict:
    llm = get_llm()
    submission = state["active_goal"]  # caller places submission text here

    prompt = f"Submission to stress-test:\n\n{submission[:12000]}"
    review = await llm.generate_structured(
        prompt=prompt, schema=ForgeReview, system=SYSTEM_PROMPT, temperature=0.3,
    )

    # Guardrail: some models lazily skip the mandatory sections — retry once
    # with an explicit demand before accepting a hollow review (US-011).
    if not review.suggested_refactors or not review.rubric_scores:
        log.info("Forge retry — missing refactors/rubric in first pass")
        try:
            better = await llm.generate_structured(
                prompt=prompt
                + "\n\nYou MUST include at least 2 suggested_refactor diffs "
                "and exactly 5 rubric_scores appropriate for this submission "
                "kind, scored 0-10 as integers.",
                schema=ForgeReview,
                system=SYSTEM_PROMPT,
                temperature=0.2,
            )
            review = ForgeReview(
                detected_kind=better.detected_kind or review.detected_kind,
                summary=better.summary or review.summary,
                strengths=better.strengths or review.strengths,
                vulnerabilities=better.vulnerabilities or review.vulnerabilities,
                suggested_refactors=better.suggested_refactors
                or review.suggested_refactors,
                rubric_scores=better.rubric_scores or review.rubric_scores,
            )
        except Exception as exc:  # noqa: BLE001 — keep the first pass instead of failing
            log.warning("Forge retry failed (%s) — keeping first pass", exc)
    log.info(
        "Forge reviewed submission kind=%s (%d vulnerabilities, %d refactors)",
        review.detected_kind,
        len(review.vulnerabilities),
        len(review.suggested_refactors),
    )
    return {
        "forge_review": review.model_dump(),
        "active_agent": "supervisor",
    }
