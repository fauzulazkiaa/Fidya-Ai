# Fidya Backend — FastAPI + LangGraph Multi-Agent System

Backend untuk Fidya AI Education Platform sesuai PRD-FIDYA-001:
**SYNTAX 6-Agent System** (Architect, Hunter, Synthesizer, Fact-Checker,
Inquisitor, Forge, Catalyst) di atas LangGraph, dengan Qdrant (vector DB),
Google Gemini (LLM/embeddings), Vertex AI ranking opsional, dan Supabase
(persistence).

## Menjalankan

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # isi kredensial bila ada
uvicorn app.main:app --reload --port 8000
```

Docs interaktif: http://localhost:8000/docs

### Mode Offline (tanpa kredensial)

Tanpa `GOOGLE_API_KEY`, `QDRANT_URL`, atau `SUPABASE_URL` sistem tetap jalan
penuh dengan fallback deterministik:

| Layanan   | Fallback                                        |
| --------- | ----------------------------------------------- |
| Gemini    | `MockLLM` — schema-aware data sintetis          |
| Embeddings| Hash-based pseudo-vectors (768d)                |
| Qdrant    | In-memory local mode (`:memory:`)               |
| Supabase  | In-memory table emulation                       |
| Re-ranking| IDF-weighted lexical overlap scorer             |

> Catatan: mode offline **in-memory store ter-reset setiap restart server**.
> Untuk persistence nyata, isi kredensial Supabase dan jalankan `schema.sql`.

### Mengaktifkan layanan production

1. **Supabase** — buat project, jalankan `schema.sql` di SQL editor, isi
   `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`.
2. **Qdrant Cloud** — isi `QDRANT_URL` + `QDRANT_API_KEY`.
3. **Gemini** — isi `GOOGLE_API_KEY` dari Google AI Studio.

## Arsitektur

```
app/
├── main.py                  # FastAPI app, CORS, healthcheck (US-001)
├── core/
│   ├── config.py            # pydantic-settings
│   ├── logging.py           # structured logs w/ agent_id (FR-1)
│   └── security.py          # PBKDF2 + JWT (NG-3)
├── db/
│   └── supabase_client.py   # chainable store + memory fallback
├── services/
│   ├── qdrant_service.py    # namespace isolation (US-002, FR-4, FR-6)
│   ├── llm.py               # Gemini wrapper + MockLLM + embeddings (US-003)
│   ├── reranker.py          # cross-encoder / vertex / lexical (FR-3)
│   ├── hunter.py            # arXiv/Wikipedia/S2 connectors (US-004)
│   ├── chunker.py           # hierarchical chunking + chunk IDs (US-005)
│   └── retrieval.py         # dual-stage retrieval engine (US-006)
├── agents/
│   ├── state.py             # SyntaxState TypedDict (US-001)
│   ├── architect.py         # syllabus generator (US-007)
│   ├── synthesizer.py       # strict citation compiler (US-008, FR-2)
│   ├── fact_checker.py      # entailment guardrail (US-009, FR-2)
│   ├── inquisitor.py        # Socratic assessor (US-010, FR-5)
│   ├── forge_agent.py       # stress-tester (US-011)
│   ├── catalyst.py          # lateral analogies (US-012)
│   └── supervisor.py        # router + graph + SSE loop (US-013)
├── api/
│   ├── deps.py              # auth dependency
│   └── routes/              # auth, curriculum, agents, documents, analytics
└── models/schemas.py        # Pydantic contracts
```

## API Endpoints (PRD §6.2)

| Method | Path | Fungsi |
| ------ | ---- | ------ |
| POST | `/api/v1/auth/register` | Registrasi email/password → JWT |
| POST | `/api/v1/auth/login` | Login → JWT |
| GET | `/api/v1/health` | Healthcheck + status layanan |
| POST | `/api/v1/curriculum/generate` | The Architect: syllabus personal (US-007) |
| GET | `/api/v1/curriculum/{id}` | Ambil curriculum milik user |
| PATCH | `/api/v1/curriculum/{id}/modules/{mid}/complete` | Progress persistence |
| POST | `/api/v1/curriculum/{id}/modules/{mid}/synthesize` | Hunter→Synth→FactCheck pipeline |
| GET | `/api/v1/curriculum/{id}/modules/{mid}/stream?token=JWT` | SSE agent transitions (FR-8) |
| POST | `/api/v1/agent/inquisitor/chat` | Socratic chat (US-010) |
| POST | `/api/v1/agent/forge/review` | Stress-test submission (US-011) |
| POST | `/api/v1/agent/catalyst/spark` | Analogy card (US-012) |
| POST | `/api/v1/documents/upload` | BYOD → namespace pribadi (US-020) |
| GET | `/api/v1/analytics/progress` | KPI progress |
| POST | `/api/v1/analytics/events` | Telemetry (citation_click dll.) |

## Garansi Keamanan Data

* **FR-6** — Query retrieval selalu difilter hard pada `namespace`; dokumen
  privat (`NS_user_{id}`) mustahil bocor lintas tenant karena filter dievaluasi
  server-side oleh Qdrant.
* **FR-2** — Fact-Checker membuang kalimat fakta tanpa sitasi valid sebelum
  konten sampai ke klien; chunk_id yang tidak dikenal langsung dihapus.

## Testing

```bash
pytest tests/ -q
```

Mencakup: chunk boundaries & ID determinism (US-005), citation parser &
manifest (US-008), namespace isolation & payload schema (US-002), guardrail
terhadap kalimat halusinasi (US-009), dan alur register→login→generate→
complete→analytics via HTTP (integrasi).
