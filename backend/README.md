# Fidya backend

FastAPI and LangGraph service for the Fidya education platform. See the [root README](../README.md) for the product overview, request flow, and CI badge. This file is the backend-specific setup.

The graph nodes are Architect, Hunter (implemented in `app/agents/supervisor.py` with connectors in `app/services/hunter.py`), Synthesizer, Fact-Checker, Inquisitor, Forge, and Catalyst. Qdrant stores chunk vectors. Gemini is optional. Supabase is optional.

## Run

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

Docs: http://localhost:8000/docs while `DEBUG=true` (the default).

### Offline

Leave `GOOGLE_API_KEY`, `QDRANT_URL`, and `SUPABASE_URL` empty. The process still serves the API:

| Service | Fallback |
| --- | --- |
| Gemini | `MockLLM` in `app/services/llm.py` |
| Embeddings | 768-d hash vectors in `embed_texts` |
| Qdrant | `QdrantClient(":memory:")` |
| Supabase | in-memory tables in `app/db/supabase_client.py` |
| Reranker | lexical overlap when `VERTEX_RANKING_ENABLED` is false |
| SMTP | log the message instead of sending it |

That memory is wiped on restart. For a hosted database, run `schema.sql` and then `migrations/` in the Supabase SQL editor, and set `SUPABASE_URL` plus `SUPABASE_SECRET_KEY` (`SUPABASE_SERVICE_KEY` still works). Qdrant Cloud uses `QDRANT_URL` and `QDRANT_API_KEY`. Gemini uses `GOOGLE_API_KEY`.

## Layout

```
app/
├── main.py                  # FastAPI app, CORS, health
├── core/                    # settings, logging, JWT, IPv4 preference
├── db/supabase_client.py    # Supabase client or in-memory store
├── services/                # chunker, hunter, llm, qdrant, reranker, retrieval
├── agents/                  # LangGraph nodes and SyntaxState
├── api/routes/              # auth, curriculum, agents, documents, analytics, newsletter
└── models/schemas.py        # request and response models
```

## HTTP routes

All paths are under `/api/v1`. Protected routes expect `Authorization: Bearer <token>` (legacy HS256 token from `/auth/login`, or a Clerk session when Clerk is configured).

| Method | Path | Role |
| --- | --- | --- |
| POST | `/auth/register` | Email and password → JWT |
| POST | `/auth/login` | Login → JWT |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me` | Update profile |
| PATCH | `/auth/me/plan` | Update plan (paid plans persist only while `DEBUG` is true) |
| GET | `/health` | Process health and which backends are live |
| POST | `/curriculum/generate` | Architect syllabus |
| GET | `/curriculum` | List the caller's curricula |
| GET | `/curriculum/{id}` | Fetch one curriculum |
| PATCH | `/curriculum/{id}/modules/{mid}/complete` | Mark a module complete and unlock the next |
| PATCH | `/curriculum/{id}/status` | Set curriculum status |
| DELETE | `/curriculum/{id}` | Delete a curriculum |
| POST | `/curriculum/{id}/modules/{mid}/synthesize` | Retrieve, then Synthesizer and Fact-Checker |
| GET | `/curriculum/{id}/modules/{mid}/stream` | SSE agent events (header auth, not a query token) |
| GET | `/agent/stream` | SSE for a module id passed as query params |
| POST | `/agent/inquisitor/chat` | Socratic reply |
| POST | `/agent/inquisitor/chat/stream` | Streamed Socratic reply |
| GET | `/agent/inquisitor/history` | Chat sessions |
| PATCH | `/agent/inquisitor/history/{session_id}` | Pin or unpin a session |
| DELETE | `/agent/inquisitor/history/{session_id}` | Delete a session |
| POST | `/agent/forge/review` | Submission review |
| POST | `/agent/forge/review/stream` | Streamed review |
| POST | `/agent/catalyst/spark` | Analogy card |
| POST | `/agent/catalyst/spark/stream` | Streamed analogy card |
| POST | `/documents/upload` | PDF, txt, or md into the caller's Qdrant namespace |
| GET | `/analytics/progress` | Completion, streak, velocity, mastery |
| POST | `/analytics/events` | Client telemetry |
| GET | `/analytics/notifications` | Notification feed |
| POST | `/newsletter/subscribe` | Public list signup |

Retrieval filters on the `namespace` payload field (`GLOBAL_KNOWLEDGE` or `NS_user_{id}`). The Fact-Checker removes chunk ids that were not retrieved and some uncited factual sentences before the lesson is stored.

## Tests

```bash
pytest
```

No API keys required. CI runs this on Python 3.11.
