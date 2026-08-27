import type {
  AnalyticsProgress,
  ChatMessage,
  ForgeReview,
  OnboardingPayload,
  Syllabus,
} from "./types";

export const mockSyllabus: Syllabus = {
  curriculum_id: "curr_demo_001",
  target_topic: "Building Production RAG Systems",
  current_level: "Intermediate",
  target_outcome:
    "Design, evaluate, and ship a production-grade retrieval-augmented generation system with grounded citations",
  target_deadline: "2026-10-15",
  hours_per_week: 12,
  learning_style: "Project-based",
  milestones: [
    {
      id: "ms-1",
      title: "Week 1 checkpoint: Retrieval fundamentals quiz",
      date: "2026-08-28",
      week: 1,
      kind: "assessment",
    },
    {
      id: "ms-2",
      title: "Ship minimal RAG prototype (v0)",
      date: "2026-09-04",
      week: 2,
      kind: "project",
    },
    {
      id: "ms-3",
      title: "Re-ranking & evaluation harness review",
      date: "2026-09-18",
      week: 4,
      kind: "review",
    },
    {
      id: "ms-4",
      title: "Production deployment + load test",
      date: "2026-10-09",
      week: 7,
      kind: "project",
    },
    {
      id: "ms-5",
      title: "Final capstone defense",
      date: "2026-10-14",
      week: 8,
      kind: "milestone",
    },
  ],
  modules: [
    {
      module_id: "mod_01",
      week: 1,
      day: 1,
      order: 1,
      title: "Embeddings & Vector Space Foundations",
      domain: "Information Retrieval",
      objectives: [
        "Explain how dense embeddings encode semantics",
        "Choose embedding models using MTEB benchmarks",
        "Reason about cosine vs dot-product similarity",
      ],
      estimated_hours: 3,
      status: "completed",
      completion: 100,
      tags: ["Embeddings", "Vectors", "Intermediate"],
      content_markdown:
        "Dense retrieval replaces lexical matching with geometry: every document is mapped to a high-dimensional vector, and relevance becomes proximity in that space [a1b2c3_p0]. Modern embedding models are trained contrastively, pulling related pairs together and pushing unrelated pairs apart [d4e5f6_p1].\n\nChoosing an embedding model is an engineering decision, not a cosmetic one. The MTEB benchmark evaluates candidates across retrieval, clustering, and classification tasks, and top open models now rival proprietary APIs [b7c8d9_p2].\n\nSimilarity metrics matter. Cosine similarity ignores vector magnitude, which is desirable when document length should not influence ranking; dot product retains magnitude signal and is standard when embeddings are normalized anyway [c9d0e1_p3].",
      citations: [
        {
          chunk_id: "a1b2c3_p0",
          index: 1,
          source_title: "Dense Passage Retrieval for Open-Domain Question Answering",
          source_url: "https://arxiv.org/abs/2004.04906",
          author: "Karpukhin et al.",
          snippet:
            "…we demonstrate that dense retrieval can outperform BM25 by up to 26% absolute points in top-100 passage retrieval accuracy…",
          kind: "public",
          published_at: "2020-04-09",
        },
        {
          chunk_id: "d4e5f6_p1",
          index: 2,
          source_title: "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks",
          source_url: "https://arxiv.org/abs/1908.10084",
          author: "Reimers & Gurevych",
          snippet:
            "…siamese network structures enable sentence pairs to be mapped to a shared vector space where semantic similarity is measured via cosine distance…",
          kind: "public",
          published_at: "2019-08-27",
        },
        {
          chunk_id: "b7c8d9_p2",
          index: 3,
          source_title: "MTEB: Massive Text Embedding Benchmark",
          source_url: "https://arxiv.org/abs/2210.07316",
          author: "Muennighoff et al.",
          snippet:
            "…we introduce the Massive Text Embedding Benchmark covering 56 datasets across retrieval, semantic similarity, clustering and classification…",
          kind: "public",
          published_at: "2022-10-13",
        },
        {
          chunk_id: "c9d0e1_p3",
          index: 4,
          source_title: "Vector Similarity Explained — Pinecone Learning Center",
          source_url: "https://www.pinecone.io/learn/vector-similarity/",
          author: "Pinecone",
          snippet:
            "…cosine similarity measures the angle between vectors irrespective of magnitude, while dot product incorporates magnitude into the score…",
          kind: "public",
        },
      ],
    },
    {
      module_id: "mod_02",
      week: 1,
      day: 2,
      order: 2,
      title: "Semantic Chunking Strategies",
      domain: "Data Engineering",
      objectives: [
        "Design chunk sizes against model context economics",
        "Implement heading-aware hierarchical chunking",
        "Evaluate chunk overlap trade-offs",
      ],
      estimated_hours: 2.5,
      status: "in_progress",
      completion: 60,
      tags: ["Chunking", "RAG"],
      content_markdown:
        "Chunking is the quiet determinant of retrieval quality: too small and context fragments lose meaning, too large and precision dilutes across noise [f1a2b3_p0]. Hierarchical strategies respect document structure — headings, paragraphs, lists — so each chunk remains a coherent unit of thought [e3b4c5_p1].\n\nOverlap of 10–20% between consecutive chunks preserves boundary continuity at modest storage cost, and unique chunk identifiers make every retrieved span traceable to its origin [d5c6b7_p2].",
      citations: [
        {
          chunk_id: "f1a2b3_p0",
          index: 1,
          source_title: "Chunking Strategies for LLM Applications — Research Notes",
          source_url: "https://arxiv.org/abs/2401.00000",
          author: "Chen et al.",
          snippet:
            "…chunk size exhibits a measurable non-monotonic relationship with downstream answer faithfulness, with optima near 300–500 tokens…",
          kind: "public",
          published_at: "2024-01-02",
        },
        {
          chunk_id: "e3b4c5_p1",
          index: 2,
          source_title: "Recursive & Structure-Aware Splitting — LlamaIndex Docs",
          source_url: "https://docs.llamaindex.ai/en/stable/module_guides/loading/node_parsers/",
          author: "LlamaIndex",
          snippet:
            "…structure-aware node parsers split along markdown headers and list boundaries before falling back to token counts…",
          kind: "public",
        },
        {
          chunk_id: "d5c6b7_p2",
          index: 3,
          source_title: "Personal notes: chunk overlap experiments.md",
          source_url: "#",
          author: "You",
          snippet:
            "…50-token overlap at 400-token chunks recovered ~92% of boundary-question accuracy versus no overlap…",
          kind: "private",
        },
      ],
    },
    {
      module_id: "mod_03",
      week: 1,
      day: 3,
      order: 3,
      title: "Vector Databases & Namespace Design",
      domain: "Infrastructure",
      objectives: [
        "Model multi-tenant isolation with namespaces",
        "Tune HNSW parameters for recall/latency",
        "Design payload schemas for citation traceability",
      ],
      estimated_hours: 3,
      status: "available",
      completion: 0,
      tags: ["Qdrant", "Multi-tenancy"],
    },
    {
      module_id: "mod_04",
      week: 2,
      day: 1,
      order: 4,
      title: "Hybrid Search & Query Transformation",
      domain: "Information Retrieval",
      objectives: [
        "Combine BM25 with dense retrieval",
        "Apply HyDE and query rewriting",
      ],
      estimated_hours: 2.5,
      status: "locked",
      completion: 0,
      tags: ["Hybrid Search", "BM25"],
    },
    {
      module_id: "mod_05",
      week: 2,
      day: 2,
      order: 5,
      title: "Cross-Encoder Re-ranking Pipelines",
      domain: "Machine Learning",
      objectives: [
        "Differentiate bi-encoder vs cross-encoder latency profiles",
        "Build two-stage retrieval with Top-K pruning",
      ],
      estimated_hours: 3,
      status: "locked",
      completion: 0,
      tags: ["Re-ranking", "Vertex AI"],
    },
    {
      module_id: "mod_06",
      week: 2,
      day: 3,
      order: 6,
      title: "Grounded Generation & Citation Enforcement",
      domain: "LLM Engineering",
      objectives: [
        "Prompt-engineer strict inline citations",
        "Validate entailment of claims against sources",
      ],
      estimated_hours: 3.5,
      status: "locked",
      completion: 0,
      tags: ["Citations", "Guardrails"],
    },
    {
      module_id: "mod_07",
      week: 3,
      day: 1,
      order: 7,
      title: "Evaluation Harnesses: Faithfulness & Recall",
      domain: "MLOps",
      objectives: [
        "Instrument RAG triad metrics",
        "Automate regression testing on golden sets",
      ],
      estimated_hours: 3,
      status: "locked",
      completion: 0,
      tags: ["Evaluation", "Ragas"],
    },
    {
      module_id: "mod_08",
      week: 3,
      day: 2,
      order: 8,
      title: "Latency, Caching & Cost Optimization",
      domain: "Infrastructure",
      objectives: [
        "Layer semantic caching safely",
        "Budget tokens across retrieval windows",
      ],
      estimated_hours: 2.5,
      status: "locked",
      completion: 0,
      tags: ["Caching", "Cost"],
    },
    {
      module_id: "mod_09",
      week: 4,
      day: 1,
      order: 9,
      title: "Capstone: Ship a Grounded RAG Service",
      domain: "Capstone",
      objectives: [
        "Integrate all pipeline stages end-to-end",
        "Pass zero-hallucination evaluation gate",
      ],
      estimated_hours: 6,
      status: "locked",
      completion: 0,
      tags: ["Capstone", "Deployment"],
    },
  ],
};

export const defaultOnboarding: OnboardingPayload = {
  target_topic: "",
  current_level: "Intermediate",
  target_outcome: "",
  target_deadline: new Date(Date.now() + 60 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10),
  hours_per_week: 10,
  learning_style: "Project-based",
};

export const mockAnalytics: AnalyticsProgress = {
  streak_days: 12,
  weekly_xp_goal: 500,
  xp_earned: 340,
  overall_completion: 22,
  velocity: [
    { date: "2026-08-17", label: "Mon", lessons_hours: 1.5, practice_hours: 0.5 },
    { date: "2026-08-18", label: "Tue", lessons_hours: 1.0, practice_hours: 1.5 },
    { date: "2026-08-19", label: "Wed", lessons_hours: 2.0, practice_hours: 1.0 },
    { date: "2026-08-20", label: "Thu", lessons_hours: 0.5, practice_hours: 0.5 },
    { date: "2026-08-21", label: "Fri", lessons_hours: 1.5, practice_hours: 2.0 },
    { date: "2026-08-22", label: "Sat", lessons_hours: 2.5, practice_hours: 1.0 },
    { date: "2026-08-23", label: "Sun", lessons_hours: 1.0, practice_hours: 0.0 },
  ],
  citation_clicks: 47,
  sessions_with_citations: 11,
  total_sessions: 28,
  mastery_scores: [
    { concept: "Embeddings", score: 4 },
    { concept: "Chunking", score: 3 },
    { concept: "Vector DBs", score: 2 },
    { concept: "Hybrid Search", score: 1 },
    { concept: "Re-ranking", score: 1 },
    { concept: "Grounding", score: 1 },
  ],
};

export const monthlyVelocity = [
  { date: "2026-07-27", label: "W1", lessons_hours: 6.0, practice_hours: 3.5 },
  { date: "2026-08-03", label: "W2", lessons_hours: 7.5, practice_hours: 4.0 },
  { date: "2026-08-10", label: "W3", lessons_hours: 5.0, practice_hours: 5.5 },
  { date: "2026-08-17", label: "W4", lessons_hours: 9.5, practice_hours: 6.5 },
];

export const catalystSparks = [
  {
    from_domain: "Computer Networking",
    to_domain: "Biological Ecosystems",
    insight:
      "Packet routing under congestion mirrors nutrient flow in mycorrhizal networks: both use local signals to reroute around damaged paths without central coordination.",
    concept: "Adaptive routing ≈ fungal resource distribution",
  },
  {
    from_domain: "Vector Retrieval",
    to_domain: "Urban Planning",
    insight:
      "A well-designed namespace is like zoning law — it does not change the buildings (vectors), but strictly controls who may enter which district (tenant isolation).",
    concept: "Namespace isolation ≈ city zoning",
  },
];

export const mockInquisitorIntro: ChatMessage = {
  id: "msg_intro",
  role: "inquisitor",
  content:
    "Before we continue: you claimed cosine similarity 'ignores magnitude'. If two documents have identical directions but very different magnitudes, what does cosine actually compare — and when would ignoring magnitude hurt you?",
};

export const mockForgeReview: ForgeReview = {
  summary:
    "Solid retrieval skeleton with clean separation of concerns. The main risks are unbounded candidate lists, missing retry logic around the embedding call, and a re-ranker threshold that silently drops results without logging.",
  strengths: [
    "Clear two-stage retrieval structure mirroring production patterns",
    "Payload schema preserves chunk provenance for citations",
    "Async I/O used consistently in the ingestion path",
  ],
  vulnerabilities: [
    {
      line: 12,
      note: "`top_k=20` is hardcoded; surface this as configuration so load tests can sweep recall/latency trade-offs.",
    },
    {
      line: 27,
      note: "No timeout or exponential backoff on the embedding request — a provider hiccup will crash ingestion mid-batch.",
    },
    {
      paragraph: 3,
      note: "The relevance cutoff discards chunks below 0.75 without recording them; add debug logging to measure false-negative rates.",
    },
  ],
  suggested_refactors: [
    {
      title: "Add resilient embedding fetch",
      diff: `-    vectors = await embed_client.embed(texts)\n+    vectors = await retry_with_backoff(\n+        lambda: embed_client.embed(texts),\n+        attempts=3,\n+        base_delay=0.5,\n+    )`,
    },
    {
      title: "Make re-ranker cutoff observable",
      diff: `+    dropped = [c for c in ranked if c.score < THRESHOLD]\n+    logger.debug("re_ranker_dropped", count=len(dropped), min_score=min((c.score for c in ranked), default=None))`,
    },
  ],
  rubric_scores: [
    { name: "Correctness", score: 7, max: 10 },
    { name: "Robustness", score: 5, max: 10 },
    { name: "Readability", score: 8, max: 10 },
    { name: "Performance", score: 6, max: 10 },
    { name: "Testability", score: 4, max: 10 },
  ],
};
