# Product Requirements Document (PRD)

# Project: Fidya AI Education Platform

**Document ID:** PRD-FIDYA-001  
**Status:** Ready for Implementation  
**Target Platform:** Web Application (Optimized for desktop MacBook displays, responsive for tablet/mobile)  
**Architecture:** Next.js 14+ (Frontend) \+ FastAPI & LangGraph (Multi-Agent Backend) \+ Qdrant (Vector DB) \+ Google Gemini & Vertex AI Ranking  
**Design Philosophy:** Minimalist Modern, Bento Grid Architecture, Soft Squircle Geometry, Low Cognitive Load

---

## 1\. Overview and Objectives

### 1.1 Problem Statement

Online self-paced education suffers from an abysmal course completion rate (typically \<10%). Learners face rigid non-adaptive curriculums, lack real-time personalized guidance, and struggle with the credibility and traceability of AI-generated educational materials (hallucinations and untraceable claims). Furthermore, learners with intermediate baselines waste hours filtering through bloated, unreliable courses across multiple fragmented platforms without clear time-bounded guarantees.

### 1.2 Product Vision

To become the world's leading personalized education platform by solving course completion bottlenecks through:

1. **Hyper-personalized, dynamic curriculum** adapted to learner background, goals, and daily time availability (reverse-engineered from strict user deadlines).  
2. **Absolute data credibility (100% grounded citations)** connecting every generated concept directly to peer-reviewed journals, university repositories, and open educational resources.  
3. **The SYNTAX 6-Agent System** providing full-lifecycle cognitive coaching (Curriculum Generation, Ingestion, Synthesis, Socratic Questioning, Work Stress-Testing, and Lateral Thinking).  
4. **All-in-One Minimalist Workspace** delivering a unified, distraction-free environment for syllabus tracking, learning, Socratic dialogue, and real-time stress testing.

### 1.3 Target Audience

1. **Self-Taught Learners & Professionals:** Ambitious self-directed individuals upskilling in technical or domain-specific areas with constrained schedules and specific target deadlines.  
2. **Data-Driven Achievers:** Learners driven by measurable progress, quantitative milestones, and rigorous evaluation who require absolute trust in learning materials.

### 1.4 Success Metrics (KPIs)

- **User Activation Rate:** $\\ge 75%$ of users complete their Week 1 personalized syllabus created by The Architect.  
- **Citation Interaction Rate:** $\\ge 35%$ of learning sessions involve clicking or inspecting interactive citation badges.  
- **Session Engagement & Retention:** Average active session duration $\>25$ minutes when engaging with The Inquisitor and The Forge.  
- **Zero-Hallucination Integrity:** $0%$ ungrounded factual assertions reaching the UI (verified by The Fact-Checker agent).

---

## 2\. UI/UX Design System & Asset Architecture

### 2.1 Design Aesthetic & Core Principles

- **Modern Minimalist & Clean Geometry:** High whitespace, uncluttered layouts, soft squircle card radii (`rounded-3xl` / 24px-28px), and subtle micro-borders (`border-zinc-200/70` in light mode, `border-zinc-800/60` in dark mode).  
- **Elimination of Warm Yellow/Beige Tones:** The interface avoids heavy warm yellow/pastel tints. Instead, it adopts a sophisticated, high-contrast, professional palette with crisp neutral slate/zinc foundations and purposeful electric indigo/teal accents for interactive states.  
- **Floating Island Navigation:** A top-anchored floating pill navigation bar (`rounded-full`, backdrop blur / glassmorphism) with pill-shaped active state indicators.  
- **Segmented Visual Metrics:** Modular progress indicators using striped/vertical-tick progress bars (`||||||||||||||||||||`), stacked rounded-pill bar charts, and calendar milestone tickers.

### 2.2 Color System & Design Tokens

| Token | Light Mode Value | Dark Mode Value | Usage |
| :---- | :---- | :---- | :---- |
| **Background (Canvas)** | `#F8FAFC` (Slate 50\) | `#09090B` (Zinc 950\) | Main viewport canvas |
| **Card / Surface** | `#FFFFFF` (White) | `#18181B` (Zinc 900\) | Bento cards, modals, sidebar surfaces |
| **Border Sub-layer** | `#E2E8F0` (Slate 200\) | `#27272A` (Zinc 800\) | 1px subtle card outlines |
| **Primary Text** | `#0F172A` (Slate 900\) | `#F8FAFC` (Slate 50\) | Headings, primary metrics, titles |
| **Secondary Text** | `#64748B` (Slate 500\) | `#A1A1AA` (Zinc 400\) | Metadata, subheaders, timestamps |
| **Accent Primary (Active/Brand)** | `#3B82F6` / `#4F46E5` (Indigo 600\) | `#60A5FA` / `#6366F1` (Indigo 400\) | Active nav pills, primary CTAs, active milestone states |
| **Academic Citation Badge (Public)** | `#059669` (Emerald 600\) | `#34D399` (Emerald 400\) | Verified public peer-reviewed citations (`[1]`, `[2]`) |
| **Private Document Citation (BYOD)** | `#2563EB` (Blue 600\) | `#60A5FA` (Blue 400\) | User-uploaded document citations |
| **Progress Indicator (Segmented)** | `#3B82F6` (Filled) / `#E2E8F0` (Empty) | `#60A5FA` (Filled) / `#27272A` (Empty) | Vertical tick progress bars (\` |

### 2.3 Key UI Components & Asset Styling

1. **Header & Navigation Bar:**  
   - Floating pill navigation with brand logo (`Fidya`), navigation tabs (`Dashboard`, `My Curriculum`, `AI Tutor`, `Forge Review`, `Analytics`), search trigger (`Cmd+K`), notification bell with unread badge, and user profile avatar.  
2. **Bento Milestone & Module Cards:**  
   - Top-left subtle 3-dot options menu (`...`).  
   - Top-right circular quick-action button with diagonal arrow (`↗`).  
   - Clean typographic title and author/domain metadata.  
   - Dual-stat pill row (e.g. `20 Hours` · `15 Lessons` / `Level: Intermediate`).  
   - Tag pills with soft background fills (`rounded-full`, e.g. `Intermediate`, `Algorithms`, `RAG`).  
   - Striped vertical tick progress bar (`||||||||||||||||||||`) showing real-time completion percentage (e.g., `60%`).  
3. **Interactive Citation Badges & Sources Drawer:**  
   - Inline micro-pill citations (`[1]`, `[2]`) with green/blue icons.  
   - Hover reveals floating glassmorphic tooltip displaying exact quoted chunk text, source publication, and author.  
   - Click opens verified external link in secure new tab or toggles side Sources Drawer.  
4. **Learning Activity & Calendar Widgets:**  
   - Stacked dual-category bar chart with rounded pill caps displaying weekly/monthly learning velocity.  
   - Mini calendar grid with active dot highlights and an adjacent "Upcoming Milestones" agenda list with time badges and vertical color markers.

---

## 3\. User Stories (Granular & Atomic)

### Epic 1: Infrastructure & Core Multi-Agent Orchestration

- **US-001: Backend Service Initialization & LangGraph State Schema**  
    
  - **Description:** As a developer, I want a FastAPI service with a centralized LangGraph state memory schema so that all 6 SYNTAX agents can read and mutate a shared context.  
  - **Acceptance Criteria:**  
    - FastAPI app configured with CORS, healthcheck endpoint (`/api/v1/health`), and structured logging.  
    - Centralized `SyntaxState` TypedDict defined with `user_id`, `active_goal`, `curriculum`, `current_module`, `messages`, `retrieved_chunks`, `verification_status`, and `active_agent`.  
    - LangGraph StateGraph initialized with empty placeholder nodes and conditional supervisor router.  
    - Typecheck and pytest suite pass.


- **US-002: Qdrant Vector DB Client & Namespacing Setup**  
    
  - **Description:** As a developer, I want a Qdrant client with namespace-isolated collections so that global public knowledge and user-private data remain strictly partitioned.  
  - **Acceptance Criteria:**  
    - Qdrant connection wrapper with retry logic and collection creation script (`fidya_knowledge_base`).  
    - Payload schema enforces `chunk_id`, `source_title`, `source_url`, `author`, `namespace`, and `timestamp`.  
    - Helper functions for creating and querying namespaces: `GLOBAL_KNOWLEDGE` and `NS_user_{user_id}`.  
    - Unit tests verifying vector insertion, payload filtering, and namespace isolation pass.


- **US-003: Gemini LLM & Vertex AI Re-ranking Integration**  
    
  - **Description:** As a developer, I want unified LLM client wrappers for Google Gemini 1.5 Pro/Flash and Vertex AI / Cross-Encoder Ranking so that agents can perform inference and semantic re-ranking with structured outputs.  
  - **Acceptance Criteria:**  
    - Wrapper for Gemini 1.5 Pro and Gemini 1.5 Flash using Google GenAI SDK with structured schema parsing (`response_schema`).  
    - Cross-Encoder Re-ranker service interface implemented to take query and candidate chunks, returning Top-K sorted by relevance score.  
    - Graceful error handling with fallback and rate limit retries.  
    - Integration tests verifying Gemini structured output generation and re-ranking pass.

### Epic 2: Grounded Citation Pipeline & Knowledge Ingestion

- **US-004: The Hunter \- Public Knowledge API Ingestion Connectors**  
    
  - **Description:** As a user, I want The Hunter agent to fetch credible reference materials from arXiv, Wikipedia, and open academic APIs on-demand so that learning modules are backed by verified sources.  
  - **Acceptance Criteria:**  
    - API clients for arXiv Search API, Wikipedia API, and Semantic Scholar API.  
    - Data normalizer extracting text, article title, authors, DOI/URL, and published date.  
    - Async fetching with caching layer to avoid redundant API hits.  
    - Unit tests with mock responses verifying parsing and metadata integrity pass.


- **US-005: Hierarchical Chunking & Unique Chunk ID Injection**  
    
  - **Description:** As a developer, I want documents chunked semantically with embedded unique chunk IDs and metadata so that citations are traceable to specific sub-sections.  
  - **Acceptance Criteria:**  
    - Semantic hierarchical chunker (paragraph/sub-heading aware, \~300-500 tokens with 50-token overlap).  
    - Unique ID generator format: `{source_slug}_{hash[:6]}_p{paragraph_idx}`.  
    - Output chunk objects include vector embeddings and metadata payload.  
    - Unit tests asserting chunk boundaries, ID determinism, and metadata retention pass.


- **US-006: Retrieval & Dual-Stage Re-ranking Engine**  
    
  - **Description:** As The Synthesizer agent, I want a dual-stage retrieval pipeline that queries Qdrant and applies Cross-Encoder re-ranking so that only the top 3-5 most accurate chunks are passed to generation.  
  - **Acceptance Criteria:**  
    - Stage 1: Vector similarity search retrieving Top-20 candidates from targeted namespace.  
    - Stage 2: Re-ranker scoring Top-20 down to Top-5 most relevant chunks with relevance threshold $\\ge 0.75$.  
    - Returns structured payload containing chunk text, `chunk_id`, source URL, and author.  
    - Integration test validating precision on benchmark queries passes.

### Epic 3: The SYNTAX 6-Agent System & Verification

- **US-007: The Architect \- Dynamic Syllabus & Milestone Generator**  
    
  - **Description:** As a learner, I want The Architect to analyze my baseline skills (e.g. Intermediate), learning goal, and target deadline to generate a customized week-by-week and day-by-day syllabus.  
  - **Acceptance Criteria:**  
    - Onboarding payload schema: `{target_topic, current_level, target_outcome, target_deadline, hours_per_week, learning_style}`.  
    - LangGraph node for The Architect invoking Gemini with JSON output for structured syllabus: milestones, daily modules, learning objectives, and required search keywords for The Hunter.  
    - Calibrates against intermediate baseline, pruning beginner 101 content automatically.  
    - Endpoint `POST /api/v1/curriculum/generate` returning syllabus and persisting to database.  
    - Automated tests validating schema compliance for diverse skill inputs pass.


- **US-008: The Synthesizer \- Strict Citation Prompting & Module Compiler**  
    
  - **Description:** As a learner, I want The Synthesizer to compile lessons with inline citation tags `[chunk_id]` for every single factual claim so that no content is fabricated.  
  - **Acceptance Criteria:**  
    - Strict system prompt mandating that claims MUST end with `[chunk_id]` and prohibiting ungrounded statements.  
    - Output format: JSON containing `module_id`, `title`, `content_markdown`, and `citations_manifest` (mapping `chunk_id` to title, URL, author, and snippet).  
    - If retrieved context is insufficient, returns explicit `INSUFFICIENT_DATA` flag to trigger The Hunter instead of hallucinating.  
    - Evaluation test suite verifying $100%$ citation ground truth pass.


- **US-009: The Fact-Checker \- Post-Generation Verification Guardrail**  
    
  - **Description:** As a system, I want The Fact-Checker agent to validate synthesized text against original chunks before delivering it to the UI, pruning or rewriting unsupported sentences.  
  - **Acceptance Criteria:**  
    - Lightweight LangGraph verification node running after The Synthesizer.  
    - Compares each sentence containing `[chunk_id]` directly against corresponding retrieved chunk text for semantic entailment.  
    - If entailment fails: flags the sentence, requests rewrite, or strips the ungrounded claim.  
    - Test suite with deliberately hallucinated mock outputs ensuring the Fact-Checker catches and rejects all ungrounded claims.


- **US-010: The Inquisitor \- Socratic Assessor Agent**  
    
  - **Description:** As a learner, I want The Inquisitor to challenge my comprehension through Socratic dialogue based on my current module so that I master core principles instead of memorizing.  
  - **Acceptance Criteria:**  
    - LangGraph node maintaining conversational memory and active module context.  
    - Generates probing questions identifying logical gaps rather than revealing answers directly.  
    - Evaluates learner replies and assigns a conceptual mastery score (1-5) with targeted hints.  
    - Endpoint `POST /api/v1/agent/inquisitor/chat` with unit tests pass.


- **US-011: The Forge \- Project & Output Stress-Tester**  
    
  - **Description:** As a learner, I want The Forge to review my submitted code, essay, or project design and provide actionable, structured critique in a split-screen view.  
  - **Acceptance Criteria:**  
    - Endpoint `POST /api/v1/agent/forge/review` accepting raw code, text, or schema submissions.  
    - Review schema: `{summary, strengths, vulnerabilities, suggested_refactors, rubric_scores}`.  
    - Provides line-level / paragraph-level annotations with exact diff recommendations.  
    - Unit tests validating diverse code/essay test inputs pass.


- **US-012: The Catalyst \- Lateral Thinking & Cross-Discipline Analogies**  
    
  - **Description:** As a learner, I want The Catalyst to generate unexpected cross-industry analogies for complex concepts so that I can spark creative problem-solving and deeper intuition.  
  - **Acceptance Criteria:**  
    - LangGraph node configured with tailored temperature ($0.7-0.85$) and prompt focusing on multi-domain synthesis (e.g. mapping computer networking to biological ecosystems).  
    - Endpoint `POST /api/v1/agent/catalyst/spark` returning structured analogy cards.  
    - Automated tests ensuring output coherence and novelty pass.


- **US-013: LangGraph Supervisor Router & Dynamic State Machine**  
    
  - **Description:** As a system, I want a Supervisor Agent node that interprets user intent, coordinates agent handoffs, and ensures cyclical refinement.  
  - **Acceptance Criteria:**  
    - Supervisor node evaluates user query \+ current state to route to `[architect, hunter, synthesizer, fact_checker, inquisitor, forge, catalyst]`.  
    - Handles automatic loop: `Synthesizer -> Fact-Checker -> (Pass: User / Fail: Synthesizer Rewrite)`.  
    - WebSocket / Server-Sent Events (SSE) streaming endpoint `GET /api/v1/agent/stream` for real-time agent state transitions.  
    - End-to-end multi-turn graph execution tests pass.

### Epic 4: Frontend Web Application (Next.js Desktop-Optimized Minimalist UI)

- **US-014: Frontend Project Setup, Design System & Design Tokens**  
    
  - **Description:** As a developer, I want a Next.js 14+ (App Router) project with Tailwind CSS, Lucide icons, and the Fidya Minimalist Design System (Slate/Zinc palette, soft squircle cards, floating nav).  
  - **Acceptance Criteria:**  
    - Next.js project with TypeScript, Tailwind CSS, and Shadcn UI component primitives configured with `rounded-3xl` radii.  
    - Palette tokens configured without warm yellow: Slate 50 base, crisp white cards, Indigo 600 active accents, and Emerald 600 citation highlights.  
    - Floating pill navigation bar component with blur backdrop and responsive mobile drawer.  
    - Linting and build pipeline pass without errors.


- **US-015: Interactive Onboarding Wizard (The Architect UI)**  
    
  - **Description:** As a new user, I want a frictionless conversational onboarding wizard to define my target deadline, baseline skill level (e.g. Intermediate), and learning goal.  
  - **Acceptance Criteria:**  
    - Multi-step interactive wizard with smooth animations: Goal & Deadline input \-\> Intermediate baseline calibration \-\> Time commitment selector \-\> Review & Generate.  
    - Visual timeline preview of generated milestones and syllabus with striped progress indicators.  
    - State saved to local storage and synced to backend API.  
    - Browser test passes for onboarding flow.


- **US-016: Module Reader with Interactive Citation Hover & Sources Drawer**  
    
  - **Description:** As a learner, I want a clean reader view where citations `[1]`, `[2]` appear as interactive green/blue pills that reveal source snippets on hover and open the original source URL on click.  
  - **Acceptance Criteria:**  
    - Markdown parser converting `[chunk_id]` tags into interactive badge components (`[1]`, `[2]`).  
    - Hovering on a badge displays a floating glassmorphic tooltip with source title, authors, exact quoted chunk snippet, and verification status.  
    - Clicking badge opens the external URL (arXiv, Wikipedia, OpenStax) in a new secure tab.  
    - Slide-out "Sources Drawer" listing all references for the current module.  
    - UI component tests pass.


- **US-017: Socratic Discussion Interface (The Inquisitor UI)**  
    
  - **Description:** As a learner, I want an interactive chat interface embedded alongside my study material to engage in real-time Socratic Q\&A with The Inquisitor.  
  - **Acceptance Criteria:**  
    - Floating / docked chat interface with streaming responses in a clean rounded-3xl container.  
    - Visual mastery badges indicating concept understanding level.  
    - Action buttons for requesting hints or asking for alternative explanations.  
    - End-to-end interaction test passes.


- **US-018: Split-Screen Reviewer Workspace (The Forge UI)**  
    
  - **Description:** As a learner, I want a split-screen workspace where I can type/paste my code or essay on the left and see line-by-line critique from The Forge on the right.  
  - **Acceptance Criteria:**  
    - Resizable split-pane layout (left: Monaco Editor / Markdown Textarea; right: The Forge feedback stream).  
    - Interactive annotation highlights linking feedback cards to specific code lines or text paragraphs.  
    - Actionable "Apply Suggestion" or copy-to-clipboard buttons.  
    - Responsive layout adapting to single-pane with toggle on smaller screens.


- **US-019: Bento Dashboard & Analytics Widgets (The Catalyst & Progress UI)**  
    
  - **Description:** As a data-driven learner, I want a minimalist Bento-Grid dashboard featuring segmented progress bars, learning velocity bar charts, upcoming milestone schedule, and a "Catalyst Spark" card.  
  - **Acceptance Criteria:**  
    - Dashboard page displaying:  
      - Top banner with streak counter and daily XP/mastery goal.  
      - Bento grid of active module cards with 3-dot menu, top-right `↗` action button, and vertical-tick progress bar (`||||||||||||`).  
      - Stacked pill bar chart showing weekly/monthly study hours.  
      - Mini calendar with highlighted active milestone dates and upcoming agenda list.  
      - "Catalyst Inspiration Card" with cross-domain analogy sparks.  
    - Fully responsive across desktop MacBook displays, iPad, and iPhone.  
    - Browser verification passes.

### Epic 5: Multi-Tenancy & Phase 2 BYOD Foundation

- **US-020: Namespace-Based Multi-Tenancy & User Document Upload API**  
  - **Description:** As a developer, I want the backend prepared for Phase 2 BYOD with isolated user namespaces (`NS_user_{id}`) and document ingestion endpoints (PDF/Markdown) so that personal documents take priority in RAG.  
  - **Acceptance Criteria:**  
    - Endpoint `POST /api/v1/documents/upload` accepting PDF, TXT, and MD files.  
    - Text extraction, hierarchical chunking, and injection into `NS_user_{user_id}` Qdrant namespace.  
    - Query routing prioritizes `NS_user_{user_id}` before falling back to `GLOBAL_KNOWLEDGE`.  
    - Differentiated citation UI metadata (Blue badge for private docs, Green badge for academic publications).  
    - Unit and security isolation tests pass.

---

## 4\. Detailed Functional Requirements

- **FR-1 (State Management):** The system must maintain a unified LangGraph central state memory across all 6 agents. State transitions must be atomic and logged with timestamp and agent ID.  
- **FR-2 (Strict Citation Grounding):** The Synthesizer is prohibited from outputting factual claims without an accompanying `[chunk_id]`. Uncited factual sentences must be intercepted and rejected by The Fact-Checker before reaching the client.  
- **FR-3 (Two-Tier Retrieval):** All retrieval requests must perform semantic vector search followed by Cross-Encoder / Vertex AI re-ranking. Chunks with relevance score $\< 0.75$ must be discarded.  
- **FR-4 (Hierarchical Metadata):** Every chunk stored in Qdrant must preserve `chunk_id`, `source_title`, `source_url`, `author`, `namespace`, `paragraph_idx`, and `created_at`.  
- **FR-5 (Socratic Constraint):** The Inquisitor must not provide direct answers to homework or conceptual questions; it must formulate guiding questions and identify logical fallacies.  
- **FR-6 (Multi-Tenancy Isolation):** User private documents must be strictly isolated via Qdrant namespaces (`NS_user_{id}`). Cross-tenant data leakage must be prevented by hard-coded namespace filtering in the retrieval service.  
- **FR-7 (Dual-Color Citation Rendering):** The frontend must render citations using distinct visual styles: Green badges with academic icons for public peer-reviewed sources, Blue badges with document icons for user-uploaded BYOD sources.  
- **FR-8 (Real-Time Streaming):** All generative responses from The Synthesizer, The Inquisitor, The Forge, and The Catalyst must stream via Server-Sent Events (SSE) to the client with sub-second time-to-first-token.  
- **FR-9 (Design Consistency):** All frontend components must adhere to the Fidya Minimalist Design System, utilizing `rounded-3xl` card containers, segmented progress indicators, high-contrast Slate/Zinc palettes, and floating pill navigation.

---

## 5\. Non-Goals (Out of Scope for MVP)

- **NG-1:** Native mobile apps (iOS/Android native binaries); MVP targets responsive Web Application on desktop/mobile browsers.  
- **NG-2:** Synchronous video call tutoring or voice agent integration (text and structured data streaming only).  
- **NG-3:** Full multi-tenant enterprise RBAC / SSO (standard JWT email/password auth for MVP).  
- **NG-4:** Automated web crawling of untrusted or paywalled websites (only verified open APIs: arXiv, Wikipedia, Semantic Scholar, OpenStax).

---

## 6\. Technical Design and Architecture

### 6.1 System Architecture Diagram

\+-------------------------------------------------------------------------+

|                        Next.js Frontend (React/TS)                      |

|  \- Floating Pill Nav   \- Bento Grid Modules   \- Segmented Progress Bars |

|  \- Module Reader       \- Interactive Citations \- Split-Screen Forge UI  |

|  \- Socratic Chat       \- Activity Chart       \- Calendar Milestone List |

\+------------------------------------+------------------------------------+

                                     | HTTPS / SSE / WebSockets

\+------------------------------------v------------------------------------+

|                         FastAPI Backend Layer                           |

|  \- API Gateway / Auth Router       \- Document Ingestion Service         |

|  \- Rate Limiter & Telemetry        \- SSE Event Stream Broadcaster       |

\+------------------------------------+------------------------------------+

                                     |

\+------------------------------------v------------------------------------+

|                   LangGraph Multi-Agent Supervisor                      |

|                                                                         |

|   \+-----------------+     \+-----------------+     \+-----------------+   |

|   |  The Architect  | \<-\> |   The Hunter    | \<-\> | The Synthesizer |   |

|   \+-----------------+     \+-----------------+     \+--------+--------+   |

|                                                            |            |

|   \+-----------------+     \+-----------------+     \+--------v--------+   |

|   |  The Catalyst   | \<-\> |    The Forge    | \<-\> |The Fact-Checker |   |

|   \+-----------------+     \+-----------------+     \+-----------------+   |

|            ^                       ^                       ^            |

|            |                       |                       |            |

|            \+-----------------------+-----------------------+            |

|                                    |                                    |

|                         \+----------v----------+                         |

|                         |    The Inquisitor   |                         |

|                         \+---------------------+                         |

\+------------------------------------+------------------------------------+

                  |                                     |

\+-----------------v-----------------+ \+-----------------v-----------------+

|     Google Gemini 1.5 Pro / Flash | |       Qdrant Vector Database      |

|    \- Structured JSON Schema       | |  \- GLOBAL\_KNOWLEDGE Namespace     |

|    \- Vertex AI Search & Ranking   | |  \- NS\_user\_{id} Namespaces        |

\+-----------------------------------+ \+-----------------------------------+

### 6.2 API Specifications

- `POST /api/v1/curriculum/generate` \- Generates personalized syllabus with target deadline & intermediate baseline calibration via The Architect.  
- `POST /api/v1/curriculum/{id}/modules/{module_id}/synthesize` \- Triggers Hunter \-\> Synthesizer \-\> Fact-Checker pipeline.  
- `GET /api/v1/curriculum/{id}/modules/{module_id}/stream` \- SSE stream for synthesized module content and citation manifest.  
- `POST /api/v1/agent/inquisitor/chat` \- Interactive Socratic query with active module context.  
- `POST /api/v1/agent/forge/review` \- Submits code/essay for split-screen stress testing.  
- `POST /api/v1/agent/catalyst/spark` \- Fetches cross-disciplinary analogy card.  
- `POST /api/v1/documents/upload` \- Ingests user-provided files into private namespace.  
- `GET /api/v1/analytics/progress` \- Returns completion percentage, streak, learning velocity hours, and citation telemetry.

---

## 7\. Testing and Verification Matrix

| Test Level | Scope | Tools / Framework | Pass Criteria |
| :---- | :---- | :---- | :---- |
| **Unit Tests** | Agent prompt parsing, chunking logic, citation format parser | Pytest, Jest | $100%$ pass, all schemas validate without exception. |
| **Grounding Evaluation** | Fact-Checker accuracy on synthetic hallucination benchmarks | Pytest \+ Gemini Eval | Fact-checker catches $100%$ of ungrounded sentences. |
| **Integration Tests** | LangGraph state transitions, Qdrant namespace queries, API routes | Pytest-asyncio, HTTPX | Successful end-to-end multi-agent execution cycle. |
| **UI Component & Visual Tests** | Bento cards, segmented progress bars, citation tooltips, split-screen editor | React Testing Library, Playwright | Renders according to Slate/Zinc design tokens with 0 visual regressions. |
| **Load & Latency** | SSE streaming latency and concurrency under 50 simultaneous users | Locust / K6 | Time to first token $\< 1.2\\text{s}$, zero connection drops. |

