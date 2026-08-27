"""Gemini LLM wrapper with structured-output support and offline fallback.

US-003: unified client for Gemini models using the public REST API directly
(the `google.generativeai` SDK is deprecated). Structured output uses
`response_schema` with a sanitized JSON-Schema subset that the API accepts.
When GOOGLE_API_KEY is missing, a deterministic MockLLM keeps the whole
pipeline runnable for development and tests.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Any, Type, TypeVar

import asyncio
import httpx
from pydantic import BaseModel

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__, "llm")

T = TypeVar("T", bound=BaseModel)

_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class LLMError(RuntimeError):
    pass


# ------------------------------------------------------------ schema cleanup
_ALLOWED_KEYS = (
    "type", "description", "enum", "items", "properties", "required", "format",
    "nullable",
)


def _flatten_nullables(node: Any) -> Any:
    """Convert `X | None` (anyOf with a null variant) into X + nullable=true —
    Gemini's structured-output API rejects bare anyOf schemas."""
    if isinstance(node, dict):
        any_of = node.get("anyOf")
        if isinstance(any_of, list):
            non_null = [s for s in any_of if s.get("type") != "null"]
            had_null = len(non_null) < len(any_of)
            if had_null and len(non_null) == 1:
                base = _flatten_nullables(non_null[0])
                meta = {
                    k: v
                    for k, v in node.items()
                    if k in ("description", "default") or k in _ALLOWED_KEYS
                    and k not in ("type", "properties", "items")
                }
                base.update({k: v for k, v in meta.items() if k not in base})
                base.setdefault("nullable", True)
                return base
        return {k: _flatten_nullables(v) for k, v in node.items()}
    if isinstance(node, list):
        return [_flatten_nullables(x) for x in node]
    return node


def gemini_safe_schema(model: Type[BaseModel]) -> dict[str, Any]:
    """Convert a Pydantic JSON-Schema into the subset Gemini's API accepts:
    strip $schema/$defs/title/additionalProperties, inline $refs, flatten
    optional unions, and mark every field required so models cannot skip
    sections of the output."""
    schema = _flatten_nullables(model.model_json_schema())
    defs = schema.get("$defs", {})

    def clean(node: Any) -> Any:
        if isinstance(node, dict):
            if "$ref" in node:
                ref_name = node["$ref"].split("/")[-1]
                return clean(defs.get(ref_name, {}))
            out = {}
            for k, v in node.items():
                if k not in _ALLOWED_KEYS or k == "required":
                    # `required` is always re-derived from the full property
                    # list so models cannot treat sections as optional.
                    continue
                if k == "items":
                    out[k] = clean(v)
                elif k == "properties":
                    props = {}
                    for pk, pv in v.items():
                        cleaned = clean(pv)
                        cleaned.pop("title", None)
                        props[pk] = cleaned
                    out[k] = props
                    # Every declared field must be present in the output —
                    # otherwise models lazily omit optional-looking arrays.
                    out["required"] = list(props.keys())
                else:
                    out[k] = v
            return out
        return node

    body = {k: v for k, v in schema.items() if k not in ("title", "$schema", "$defs")}
    return clean(body)


# ------------------------------------------------------------------- clients
class BaseLLM:
    async def generate_structured(
        self, prompt: str, schema: Type[T], *, system: str = "", temperature: float = 0.4
    ) -> T:
        raise NotImplementedError

    async def generate_text(
        self, prompt: str, *, system: str = "", temperature: float = 0.4
    ) -> str:
        raise NotImplementedError

    def stream_text(
        self, prompt: str, *, system: str = "", temperature: float = 0.4
    ):
        """Async generator of text chunks (FR-8 sub-second time-to-first-token).
        Default fallback: yield the full non-streamed answer in one chunk."""
        async def _fallback():
            text = await self.generate_text(prompt, system=system, temperature=temperature)
            yield text
        return _fallback()


class GeminiLLM(BaseLLM):
    """Google Gemini via REST with rate-limit retries."""

    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or settings.gemini_model

    @staticmethod
    def _extract_text(data: dict) -> str:
        parts = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [])
        )
        return "".join(p.get("text", "") for p in parts)

    async def generate_structured(
        self, prompt: str, schema: Type[T], *, system: str = "", temperature: float = 0.4
    ) -> T:
        raw = await self.generate_text(
            prompt,
            system=system,
            temperature=temperature,
            json_schema=gemini_safe_schema(schema),
        )
        stripped = (
            raw.strip()
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
        )
        try:
            return schema.model_validate_json(stripped)
        except ValueError:
            log.warning("Structured parse failed on: %s", raw[:200])
            raise

    async def generate_text(
        self,
        prompt: str,
        *,
        system: str = "",
        temperature: float = 0.4,
        json_schema: dict | None = None,
    ) -> str:
        url = f"{_BASE_URL}/models/{self.model_name}:generateContent"
        payload: dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": temperature,
                **(
                    {
                        "responseMimeType": "application/json",
                        "responseSchema": json_schema,
                    }
                    if json_schema
                    else {}
                ),
            },
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}

        last_error: Exception | None = None
        async with httpx.AsyncClient(timeout=90) as client:  # 90s: long synthesis needs room
            for attempt in range(3):
                if attempt:
                    # Exponential backoff; only transient failures reach here.
                    await asyncio.sleep(0.5 * 2 ** (attempt - 1))
                try:
                    resp = await client.post(
                        url,
                        headers={"X-goog-api-key": settings.google_api_key},
                        json=payload,
                    )
                    data = resp.json()
                    if resp.status_code == 503:
                        raise RuntimeError("model overloaded (503)")
                    resp.raise_for_status()
                    if "promptFeedback" in data and "blockReason" in data.get(
                        "promptFeedback", {}
                    ):
                        raise LLMError(f"Blocked: {data['promptFeedback']}")
                    return self._extract_text(data)
                except LLMError:
                    raise  # content blocks are permanent — never retry
                except httpx.HTTPStatusError as exc:
                    if exc.response.status_code < 500 and exc.response.status_code != 429:
                        raise LLMError(
                            f"Gemini rejected the request ({exc.response.status_code})"
                        )
                    last_error = exc
                    log.warning("Gemini attempt %d failed: %s", attempt + 1, exc)
                except Exception as exc:  # noqa: BLE001 — network / provider errors retry
                    last_error = exc
                    log.warning("Gemini attempt %d failed: %s", attempt + 1, exc)
        raise LLMError(f"Gemini generation failed after retries: {last_error}")

    def stream_text(
        self, prompt: str, *, system: str = "", temperature: float = 0.4
    ):
        """Stream tokens via Gemini's SSE endpoint (FR-8)."""
        return self._stream(prompt, system=system, temperature=temperature)

    async def _stream(
        self, prompt: str, *, system: str, temperature: float
    ):
        url = f"{_BASE_URL}/models/{self.model_name}:streamGenerateContent?alt=sse"
        payload: dict[str, Any] = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": temperature},
        }
        if system:
            payload["systemInstruction"] = {"parts": [{"text": system}]}
        try:
            async with httpx.AsyncClient(timeout=120) as client:
                async with client.stream(
                    "POST",
                    url,
                    headers={"X-goog-api-key": settings.google_api_key},
                    json=payload,
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        try:
                            data = json.loads(line[len("data: "):])
                        except ValueError:
                            continue
                        text = self._extract_text(data)
                        if text:
                            yield text
        except httpx.HTTPError as exc:
            log.warning("Streaming failed mid-flight: %s", exc)


class MockLLM(BaseLLM):
    """Deterministic stand-in used when no API key is configured."""

    async def generate_structured(
        self, prompt: str, schema: Type[T], *, system: str = "", temperature: float = 0.4
    ) -> T:
        return schema.model_validate(_mock_from_schema(schema, prompt))

    async def generate_text(
        self, prompt: str, *, system: str = "", temperature: float = 0.4
    ) -> str:
        return (
            "[mock] Grounded answer derived strictly from the retrieved "
            "chunks for: " + prompt[:120]
        )


def _extract_topic(prompt: str) -> str:
    """Best-effort topic extraction from a prompt for MockLLM context.

    Looks for 'target_topic', 'title', 'Module title', or 'Concept:' markers
    in the prompt; falls back to the first non-trivial line.
    """
    import re
    for pattern in (
        r'"target_topic"\s*:\s*"([^"]{3,80})"',
        r'"title"\s*:\s*"([^"]{3,80})"',
        r"Module title:\s*(.+)",
        r"Concept:\s*(.+)",
    ):
        m = re.search(pattern, prompt[:600])
        if m:
            return m.group(1).strip()
    # Fall back to the first substantial line
    for line in prompt.splitlines():
        line = line.strip()
        if len(line) > 10 and not line.startswith("{") and not line.startswith("["):
            return line[:60]
    return "the learning goal"


def _mock_from_schema(schema: Type[BaseModel], prompt: str, _idx: int = 0) -> Any:
    """Recursively fabricate minimal valid data for a schema."""
    import types
    import typing

    if schema in (str, int, float, bool):
        default = {"str": "mock", "int": 1, "float": 1.0, "bool": True}
        return default.get(getattr(schema, "__name__", "str"), "mock")

    hints = getattr(schema, "model_fields", {})
    out: dict[str, Any] = {}

    def _unwrap(ann: Any) -> tuple[Any, bool]:
        origin = typing.get_origin(ann)
        if origin is not None and origin in (types.UnionType, typing.Union):
            args = typing.get_args(ann)
            non_none = [a for a in args if a is not type(None)]
            return (non_none[0] if non_none else str), len(non_none) < len(args)
        return ann, False

    def _value_for(name: str, ann: Any, idx: int = 0) -> Any:
        ann, _allows_none = _unwrap(ann)
        origin = getattr(ann, "__origin__", None)
        args = getattr(ann, "__args__", ())

        if origin is list:
            inner = args[0] if args else str
            inner_unwrapped, _ = _unwrap(inner)
            if hasattr(inner_unwrapped, "model_fields"):
                count = {
                    "ModulePlan": 5,
                    "Vulnerability": 2,
                    "Refactor": 2,
                    "RubricScore": 5,
                }.get(inner_unwrapped.__name__, 2)
                return [
                    _mock_from_schema(inner_unwrapped, prompt, _idx=i)
                    for i in range(count)
                ]
            sample = {
                "objectives": [
                    "Understand the core mechanism",
                    "Apply it in a practical exercise",
                ],
                "search_keywords": [
                    "retrieval augmented generation",
                    "dense passage retrieval",
                ],
                "strengths": ["Clear structure"],
            }
            base = sample.get(name, [name.replace("_", " ")])
            return base if isinstance(base, list) else [base]

        if hasattr(ann, "model_fields"):
            return _mock_from_schema(ann, prompt, _idx=idx)

        if ann is int:
            specials = {
                "week": min(idx // 2 + 1, 8),
                "day": (idx % 3) + 1,
                "line": 12,
                "paragraph": idx + 1,
            }
            if name in specials:
                return specials[name]
            if name == "score":
                return 7
            if name == "max":
                return 10
            return max(idx, 1)

        if ann is float:
            if "hours" in name or "score" in name:
                return 2.5
            return 0.85
        if ann is bool:
            return True

        text_defaults = {
            "title": (
                f"Core Concepts {idx + 1}"
                if idx
                else "Foundations & Fundamentals"
            ),
            "curriculum_title": _extract_topic(prompt) + " Mastery",
            "summary": "Overall the submission shows solid fundamentals with clear structure; main risks lie in edge-case handling and missing validation around external inputs.",
            "reply": "Interesting position — but what would need to be true for the opposite to hold?",
            "insight": "Complex systems, whether in computing or nature, share the same principle: local rules produce emergent global behaviour without central coordination.",
            "concept": "Adaptive learning ≈ ecosystem resource distribution",
            "from_domain": "The subject being studied",
            "to_domain": "Natural Systems",
            "note": "Hardcoded limit should be surfaced as configuration.",
            "diff": "- top_k=20\n+ top_k=settings.retrieval_top_k",
            "name": "Correctness",
            "target_topic": _extract_topic(prompt),
            "current_level": "Intermediate",
            "learning_style": "Project-based",
            "target_outcome": f"Master the key principles of {_extract_topic(prompt)}",
            "kind": "assessment",
            "domain": "Core Concepts",
            "date": "",
        }
        if name in text_defaults and not isinstance(text_defaults[name], type(None)):
            val = text_defaults[name]
            if val == "" and name == "date":
                from datetime import date as _d, timedelta as _td

                return (_d.today() + _td(days=7 * (idx + 1))).isoformat()
            return val
        if "chunk" in name:
            return []
        return name.replace("_", " ")

    cls_name = getattr(schema, "__name__", "")
    for name, field in hints.items():
        ann = field.annotation
        if cls_name == "ModulePlan" and name == "title":
            out[name] = (
                "Embeddings & Vector Space Foundations"
                if _idx == 0
                else f"Pipeline Stage {_idx + 1}: Retrieval & Grounding Techniques"
            )
            continue
        out[name] = _value_for(name, ann, _idx)

    if "content_markdown" in out and not out["content_markdown"]:
        title = next((v for k, v in out.items() if k == "title"), "this module")
        out["content_markdown"] = (
            f"# {title}\n\nThis lesson was compiled from retrieved chunks.\n\n"
            "Key claims are cited inline; see the citations manifest for exact "
            "source snippets supporting every statement."
        )
    log.debug("MockLLM produced %s", json.dumps(out)[:200])
    return out


@lru_cache
def get_llm(fast: bool = False) -> BaseLLM:
    """fast=True uses the Flash model for cheap agent steps."""
    if not settings.has_gemini:
        return MockLLM()
    return GeminiLLM(settings.gemini_flash_model if fast else None)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embeddings via Gemini REST using batchEmbedContents (up to 100 per
    request — much faster than N individual calls). Deterministic hash
    fallback when offline. Output dimensionality fixed at 768 to match the
    Qdrant collection."""
    if not texts:
        return []

    if settings.has_gemini:
        model_short = settings.embedding_model.split("/")[-1]
        url = f"{_BASE_URL}/models/{model_short}:batchEmbedContents"

        # Gemini batchEmbedContents accepts up to 100 requests per call.
        BATCH_SIZE = 100
        results: list[list[float]] = []

        async with httpx.AsyncClient(timeout=60) as client:
            for i in range(0, len(texts), BATCH_SIZE):
                batch = texts[i : i + BATCH_SIZE]
                payload = {
                    "requests": [
                        {
                            "model": settings.embedding_model,
                            "content": {"parts": [{"text": t}]},
                            "outputDimensionality": 768,
                        }
                        for t in batch
                    ]
                }
                resp = await client.post(
                    url,
                    headers={"X-goog-api-key": settings.google_api_key},
                    json=payload,
                )
                resp.raise_for_status()
                data = resp.json()
                for emb in data.get("embeddings", []):
                    results.append(emb["values"])
        return results

    # Offline fallback: stable pseudo-embeddings from token hashes.
    # hashlib is used instead of builtin hash() which is salted per process
    # (PYTHONHASHSEED) — vectors must be deterministic across restarts.
    import hashlib

    vectors: list[list[float]] = []
    for text in texts:
        vec = [0.0] * 768
        for token in text.lower().split():
            digest = int.from_bytes(hashlib.md5(token.encode()).digest(), "big")
            vec[digest % 768] += 1.0
        norm = sum(v * v for v in vec) ** 0.5 or 1.0
        vectors.append([v / norm for v in vec])
    return vectors
