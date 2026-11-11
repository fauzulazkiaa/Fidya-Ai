"""LangGraph Supervisor router & dynamic state machine (US-013).

Routes user intent to the right agent and enforces the cyclical refinement
loop:  Synthesizer -> Fact-Checker -> (pass: done | fail/rewrite: Synthesizer)
"""

from __future__ import annotations

from collections.abc import AsyncIterator

from langgraph.graph import END, StateGraph
from langgraph.graph.state import CompiledStateGraph

from app.agents.catalyst import catalyst_node
from app.agents.architect import architect_node
from app.agents.fact_checker import fact_checker_node
from app.agents.forge_agent import forge_node
from app.agents.inquisitor import inquisitor_node
from app.agents.state import SyntaxState
from app.agents.synthesizer import synthesizer_node
from app.core.logging import get_logger
from app.services.hunter import get_hunter
from app.services.llm import embed_texts

log = get_logger(__name__, "supervisor")


# --------------------------------------------------------------------- hunter
async def hunter_node(state: SyntaxState) -> dict:
    """Fetch credible sources for the current module's search keywords."""
    from app.services.chunker import RawDocument, chunk_documents
    from app.services.qdrant_service import GLOBAL_KNOWLEDGE, get_vector_store

    module = state.get("current_module", {})
    keywords = module.get("search_keywords") or [module.get("title", state.get("active_goal", "education"))]
    if isinstance(keywords, str):
        keywords = [keywords]

    docs = await get_hunter().hunt(keywords, max_per_source=3)
    if not docs and len(keywords) > 1:
        # Over-specific multi-keyword queries often return zero hits —
        # retry once with just the primary topic before giving up.
        log.info("Hunter retry with primary keyword only: %s", keywords[0])
        docs = await get_hunter().hunt([keywords[0]], max_per_source=3)
    chunks = chunk_documents([RawDocument(**d) for d in docs])
    if not chunks:
        log.warning("Hunter found nothing for %s", keywords)
        return {"retrieved_chunks": [], "active_agent": "synthesizer"}

    vectors = await embed_texts([c["text"] for c in chunks])
    store = get_vector_store()
    # Public knowledge always lands in the global namespace (FR-6).
    await store.upsert_chunks(chunks, vectors, GLOBAL_KNOWLEDGE)

    return {"retrieved_chunks": [{**c, "namespace": GLOBAL_KNOWLEDGE} for c in chunks]}


# ------------------------------------------------------------------ supervisor
def route_from_supervisor(state: SyntaxState) -> str:
    """Interpret intent and pick the next agent node."""
    active = state.get("active_agent", "supervisor")
    if active != "supervisor":
        return active
    intent = state.get("intent", "synthesize")
    mapping = {
        "generate": "architect",
        "synthesize": "synthesizer",
        "inquisitor": "inquisitor",
        "forge": "forge",
        "catalyst": "catalyst",
    }
    nxt = mapping.get(intent, "synthesizer")
    log.info("Supervisor routing '%s' -> %s", intent, nxt)
    return nxt


def route_after_fact_checker(state: SyntaxState) -> str:
    """Stop after a pass or two rewrites; otherwise send the draft back."""
    status = state.get("verification_status", "pending")
    attempts = state.get("rewrite_attempts", 0)
    if status == "passed" or attempts >= 2:
        return END
    return "synthesizer"


# ------------------------------------------------------------------- assembly
_compiled = None


def build_graph() -> CompiledStateGraph:
    """Compile the SYNTAX graph once and reuse it."""
    global _compiled
    if _compiled is not None:
        return _compiled

    g = StateGraph(SyntaxState)
    g.add_node("architect", architect_node)
    g.add_node("hunter", hunter_node)
    g.add_node("synthesizer", synthesizer_node)
    g.add_node("fact_checker", fact_checker_node)
    g.add_node("inquisitor", inquisitor_node)
    g.add_node("forge", forge_node)
    g.add_node("catalyst", catalyst_node)

    g.set_conditional_entry_point(
        route_from_supervisor,
        {
            "architect": "architect",
            "hunter": "hunter",
            "synthesizer": "synthesizer",
            "inquisitor": "inquisitor",
            "forge": "forge",
            "catalyst": "catalyst",
        },
    )
    g.add_conditional_edges(
        "synthesizer",
        route_from_synthesizer,
        {"hunter": "hunter", "fact_checker": "fact_checker"},
    )
    g.add_edge("hunter", "synthesizer")
    g.add_conditional_edges(
        "fact_checker",
        route_after_fact_checker,
        {"synthesizer": "synthesizer", END: END},
    )
    g.add_edge("architect", END)
    g.add_edge("inquisitor", END)
    g.add_edge("forge", END)
    g.add_edge("catalyst", END)

    _compiled = g.compile()
    log.info("LangGraph SYNTAX graph compiled")
    return _compiled


def route_from_synthesizer(state: SyntaxState) -> str:
    """Send an ungrounded draft back to the Hunter; otherwise fact-check it."""
    if state.get("draft_content") == "INSUFFICIENT_DATA":
        return "hunter"
    return "fact_checker"


async def run_graph_stream(initial_state: SyntaxState) -> AsyncIterator[dict]:
    """Run the graph yielding agent-transition events for SSE (FR-8)."""
    graph = build_graph()
    state = initial_state

    intent = state.get("intent")
    entry_map = {
        "generate": ["architect"],
        "synthesize": ["hunter", "synthesizer", "fact_checker"],
        "inquisitor": ["inquisitor"],
        "forge": ["forge"],
        "catalyst": ["catalyst"],
    }
    pipeline = entry_map.get(intent, ["synthesizer", "fact_checker"])

    for agent in pipeline:
        yield {"event": "agent_start", "agent": agent}
        if agent == "architect":
            update = await architect_node(state)
        elif agent == "hunter":
            update = await hunter_node(state)
        elif agent == "synthesizer":
            update = await synthesizer_node(state)
            # INSUFFICIENT_DATA → dispatch The Hunter once, then re-synthesize.
            if update.get("draft_content") == "INSUFFICIENT_DATA":
                yield {"event": "agent_start", "agent": "hunter"}
                hunt_update = await hunter_node(state)
                state = {**state, **hunt_update}
                yield {"event": "agent_done", "agent": "hunter"}
                if hunt_update.get("retrieved_chunks"):
                    # Two chances post-hunt — Flash sometimes false-flags.
                    for _ in range(2):
                        update = await synthesizer_node(state)
                        if update.get("draft_content") != "INSUFFICIENT_DATA":
                            break
        elif agent == "fact_checker":
            update = await fact_checker_node(state)
            # cyclical refinement loop (US-013)
            while update.get("verification_status") in ("rewrite", "failed") and state.get(
                "rewrite_attempts", 0
            ) < 2:
                state = {**state, **update, "rewrite_attempts": state.get("rewrite_attempts", 0) + 1}
                yield {"event": "agent_retry", "agent": "synthesizer"}
                synth_update = await synthesizer_node(state)
                state = {**state, **synth_update}
                update = await fact_checker_node(state)
        elif agent == "inquisitor":
            update = await inquisitor_node(state)
        elif agent == "forge":
            update = await forge_node(state)
        else:
            update = await catalyst_node(state)

        state = {**state, **update}
        yield {"event": "agent_done", "agent": agent}

    yield {"event": "graph_complete"}
