# Fidya backend

FastAPI service and LangGraph agents for the Fidya education app. The root [README](../README.md) covers the frontend, request flow, and project layout. This file is how to run the API.

Agents live in `app/agents/`:

| File | Role |
| --- | --- |
| `architect.py` | Personalized week-by-week syllabus from the onboarding payload. |
| `supervisor.py` (`hunter_node`) | Fetch, chunk, embed, and store public sources. HTTP clients are in `app/services/hunter.py`. |
| `synthesizer.py` | Cited markdown lesson, or `INSUFFICIENT_DATA`. |
| `fact_checker.py` | Drop sentences whose `[chunk_id]` is missing or does not overlap the chunk. |
| `inquisitor.py` | One Socratic reply and a mastery score from 1 to 5. |
| `forge_agent.py` | Structured review of a learner submission. |
| `catalyst.py` | One cross-domain analogy card. |
| `state.py` | Shared `SyntaxState`. |
| `supervisor.py` | Intent routing and the compiled graph. HTTP handlers call the nodes directly. |

## Run

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Docs: http://localhost:8000/docs when `DEBUG=true`.

### Offline (no API keys)

Leave `GOOGLE_API_KEY`, `QDRANT_URL`, and `SUPABASE_URL` empty. The process still serves the API:

| Service | Fallback |
| --- | --- |
| Gemini | `MockLLM` in `app/services/llm.py` |
| Embeddings | Hash-based 768-d vectors |
| Qdrant | In-memory client (`:memory:`) |
| Supabase | In-memory tables in `app/db/supabase_client.py` |
| Re-ranking | Lexical overlap (`VERTEX_RANKING_ENABLED=false`) |
| SMTP | Emails are not sent |

The in-memory stores reset on restart. Synthesizing a module still calls public source APIs through the Hunter. `pytest` does not.

For a real database, create a Supabase project, run `schema.sql`, then `migrations/`, and set `SUPABASE_URL` plus `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_KEY`). Qdrant Cloud needs `QDRANT_URL` and `QDRANT_API_KEY`. Gemini needs `GOOGLE_API_KEY`.

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

No API keys required. CI runs this on Python 3.11.

## HTTP API

All routes are under `/api/v1`. Protected routes expect `Authorization: Bearer <token>`.

| Method | Path | Role |
| --- | --- | --- |
| POST | `/auth/register` | Email and password → JWT |
| POST | `/auth/login` | Login → JWT |
| GET | `/health` | Liveness and which backends are configured |
| POST | `/curriculum/generate` | Architect syllabus |
| GET | `/curriculum/{id}` | Curriculum owned by the caller |
| PATCH | `/curriculum/{id}/modules/{mid}/complete` | Mark a module complete |
| POST | `/curriculum/{id}/modules/{mid}/synthesize` | Retrieve → synthesize → fact-check |
| GET | `/curriculum/{id}/modules/{mid}/stream` | SSE agent events (Authorization header, not a query token) |
| POST | `/agent/inquisitor/chat` | Socratic chat |
| POST | `/agent/forge/review` | Submission review |
| POST | `/agent/catalyst/spark` | Analogy card |
| POST | `/documents/upload` | Chunk an upload into the caller's Qdrant namespace |
| GET | `/analytics/progress` | Progress derived from stored activity |
| POST | `/analytics/events` | Client telemetry |

Retrieval filters on the `namespace` payload field (`NS_user_{id}` and `GLOBAL_KNOWLEDGE`). The fact-checker removes sentences that cite an unknown chunk id.
