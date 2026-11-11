"""The Catalyst — lateral thinking & cross-discipline analogies (US-012).

High temperature (0.7–0.85) multi-domain synthesis producing unexpected
analogy cards that spark creative problem-solving.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.agents.state import SyntaxState
from app.core.logging import get_logger
from app.services.llm import get_llm

log = get_logger(__name__, "catalyst")

SYSTEM_PROMPT = """You are The Catalyst of the Fidya education platform.

Generate ONE unexpected cross-disciplinary analogy card that maps the given
concept onto a distant domain (biology, music, urban planning, economics…).
The analogy must be structurally accurate — not decorative. Format:

- from_domain / to_domain: the two fields being bridged
- insight: 1-2 sentences explaining the mapping precisely
- concept: a compact "X ≈ Y" label"""


class CatalystSpark(BaseModel):
    concept: str
    from_domain: str
    to_domain: str
    insight: str


async def catalyst_node(state: SyntaxState) -> dict:
    """Produce one cross-domain analogy card for the current module."""
    llm = get_llm(fast=True)
    module = state.get("current_module", {})
    concept = module.get("title") or state.get("active_goal", "the learning goal")

    spark = await llm.generate_structured(
        prompt=f"Concept: {concept}\nModule objectives: {module.get('objectives', [])}",
        schema=CatalystSpark,
        system=SYSTEM_PROMPT,
        temperature=0.8,  # tailored lateral-thinking temperature (US-012)
    )
    log.info("Catalyst sparked '%s ≈ %s'", spark.from_domain, spark.to_domain)
    return {"catalyst_spark": spark.model_dump(), "active_agent": "supervisor"}
