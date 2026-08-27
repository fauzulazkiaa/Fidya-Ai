"""The Architect — dynamic syllabus & milestone generator (US-007).

Calibrates against the learner's baseline, pruning beginner 101 content for
Intermediate/Advanced learners, and reverse-engineers weekly load from the
strict target deadline.
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timedelta

from pydantic import BaseModel, Field

from app.agents.state import SyntaxState
from app.core.logging import get_logger
from app.services.llm import get_llm

log = get_logger(__name__, "architect")

SYSTEM_PROMPT = """You are The Architect of the Fidya education platform.
Design a personalized week-by-week curriculum. Rules:
- Calibrate to the learner's stated level; for Intermediate/Advanced learners
  prune all beginner 101 content entirely.
- Every module needs concrete learning objectives.
- Provide `search_keywords` per module — specific phrases The Hunter agent
  will use to fetch peer-reviewed sources.
- Respect hours_per_week strictly; modules must fit the deadline."""


class ModulePlan(BaseModel):
    title: str = Field(description="Module title")
    week: int = Field(description="1-based week number")
    day: int = Field(description="Day within the week (1-3)")
    domain: str = ""
    objectives: list[str] = Field(default_factory=list)
    estimated_hours: float = 2.5
    tags: list[str] = Field(default_factory=list)
    search_keywords: list[str] = Field(default_factory=list)


class MilestonePlan(BaseModel):
    title: str
    date: str
    week: int
    kind: str = "milestone"  # assessment | project | review | milestone


class SyllabusPlan(BaseModel):
    curriculum_title: str
    milestones: list[MilestonePlan] = Field(default_factory=list)
    modules: list[ModulePlan] = Field(default_factory=list)


async def architect_node(state: SyntaxState) -> dict:
    """LangGraph node: generate a full syllabus from onboarding payload."""
    llm = get_llm()
    payload = state["curriculum"]  # onboarding payload placed here by caller

    plan = await llm.generate_structured(
        prompt=json.dumps(payload, ensure_ascii=False),
        schema=SyllabusPlan,
        system=SYSTEM_PROMPT,
        temperature=0.4,
    )
    log.info("Architect produced %d modules", len(plan.modules))

    start = datetime.fromisoformat(payload["target_deadline"])
    weeks_total = max(1, (start - datetime.now()).days // 7)
    per_week_hours = payload.get("hours_per_week", 8)

    modules_out = []
    for i, m in enumerate(plan.modules):
        modules_out.append(
            {
                "module_id": f"mod_{i + 1:02d}",
                "order": i + 1,
                "week": min(m.week, max(weeks_total, 1)),
                "day": min(m.day, 3),
                "title": m.title,
                "domain": m.domain,
                "objectives": m.objectives,
                "estimated_hours": m.estimated_hours,
                "tags": m.tags,
                "search_keywords": m.search_keywords,
                "status": "available" if i == 0 else "locked",
                "completion": 0,
            }
        )

    milestones_out = [
        {
            "id": f"ms-{i + 1}",
            "title": ms.title,
            "date": ms.date or (datetime.now() + timedelta(days=7 * (i + 1))).strftime("%Y-%m-%d"),
            "week": ms.week,
            "kind": ms.kind,
        }
        for i, ms in enumerate(plan.milestones)
    ]
    if not milestones_out:  # guarantee at least a final milestone
        milestones_out.append(
            {
                "id": "ms-final",
                "title": f"Capstone: {payload.get('target_outcome', 'final project')}",
                "date": payload["target_deadline"],
                "week": max(weeks_total, 1),
                "kind": "milestone",
            }
        )

    curriculum = {
        **payload,
        "curriculum_id": state["curriculum"].get("curriculum_id", ""),
        "curriculum_title": plan.curriculum_title,
        "modules": modules_out,
        "milestones": milestones_out,
        "weeks_total": math.ceil(len(modules_out) / max(per_week_hours / 3, 1)) or weeks_total,
    }
    return {"curriculum": curriculum, "active_agent": "supervisor"}
