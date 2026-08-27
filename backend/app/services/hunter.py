"""The Hunter — public knowledge API ingestion connectors (US-004).

Sources (NG-4 compliant, verified open APIs only):
    * arXiv Export API            — peer-reviewed preprints
    * OpenAlex                    — 250M+ scholarly works index (journals)
    * DOAJ                        — peer-reviewed open-access journals
    * Europe PMC                  — peer-reviewed open-access papers
    * Wikipedia REST API          — encyclopedic grounding (full-text extract)
    * Semantic Scholar Graph API  — DOI/abstract metadata

All connectors normalise to a common document dict:
    {source_title, source_url, author, text, published_at}
with an in-process TTL cache to avoid redundant API hits.
"""

from __future__ import annotations

import re
import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from functools import lru_cache
from urllib.parse import quote

import httpx

from app.core.logging import get_logger

log = get_logger(__name__, "hunter")

_UA = {"User-Agent": "Fidya-Education-Platform/1.0 (https://fidya.ai)"}
_CACHE_TTL_SECONDS = 3600


@dataclass
class CachedResponse:
    value: list[dict]
    expires_at: float = field(default_factory=lambda: time.time() + _CACHE_TTL_SECONDS)


class HunterCache:
    def __init__(self) -> None:
        self._store: dict[str, CachedResponse] = {}

    def get(self, key: str) -> list[dict] | None:
        entry = self._store.get(key)
        if not entry:
            return None
        if entry.expires_at < time.time():
            del self._store[key]
            return None
        return entry.value

    def set(self, key: str, value: list[dict]) -> None:
        self._store[key] = CachedResponse(value)


def _merge(docs: list[dict], candidate: dict, seen: set[str]) -> None:
    """Append a normalised doc unless its URL/title was already collected."""
    key = candidate.get("source_url") or candidate.get("source_title")
    if not key or key in seen or not candidate.get("text"):
        return
    seen.add(key)
    docs.append(candidate)


def _core_phrase(keyword: str, max_words: int = 3) -> str:
    """Trim an Architect-generated keyword phrase to its core concept.

    'Scalar Quantization vector memory footprint' -> 'Scalar Quantization'
    Long descriptive phrases AND-ed across APIs return irrelevant hits;
    the leading noun phrase is where the actual topic lives.
    """
    words = [w for w in re.findall(r"[A-Za-z0-9\-]+", keyword) if len(w) > 1]
    stop = {"for", "with", "using", "via", "and", "the", "of", "in", "on",
            "to", "a", "an", "how", "why", "what"}
    content_words = [w for w in words if w.lower() not in stop]
    return " ".join((content_words or words)[:max_words])


class Hunter:
    """Fetches credible reference material on-demand."""

    def __init__(self) -> None:
        self.cache = HunterCache()

    async def hunt(self, keywords: list[str], max_per_source: int = 3) -> list[dict]:
        """Query all sources in parallel and merge normalised results.

        Wikipedia is capped below the academic sources so peer-reviewed
        material always forms the majority of the knowledge base.
        """
        import asyncio

        wiki_limit = max(1, min(max_per_source - 1, 2))
        tasks = [
            self.search_arxiv(keywords, max_per_source),
            self.search_openalex(keywords, max_per_source),
            self.search_doaj(keywords, max_per_source),
            self.search_europe_pmc(keywords, max_per_source),
            self.search_wikipedia(keywords, wiki_limit),
            self.search_semantic_scholar(keywords, max_per_source),
        ]
        batches = await asyncio.gather(*tasks, return_exceptions=True)
        docs: list[dict] = []
        for batch in batches:
            if isinstance(batch, Exception):
                log.warning("Hunter source failed: %s", batch)
                continue
            docs.extend(batch)
        log.info("Hunted %d documents for %s", len(docs), keywords)
        return docs

    # ------------------------------------------------------------------ arXiv
    async def search_arxiv(self, keywords: list[str], limit: int = 3) -> list[dict]:
        docs: list[dict] = []
        seen: set[str] = set()
        phrases = [_core_phrase(k) for k in keywords[:3]]
        cache_key = f"arxiv:{'|'.join(phrases)}"
        if cached := self.cache.get(cache_key):
            return cached

        # One quoted-phrase query per keyword — AND-ing every word of every
        # keyword together matches irrelevant papers (e.g. "scalar curvature").
        async with httpx.AsyncClient(
            headers=_UA, timeout=15, follow_redirects=True
        ) as client:
            for phrase in phrases:
                query = "+AND+".join(f'%22{w}%22' for w in phrase.split())
                url = (
                    "https://export.arxiv.org/api/query"
                    f"?search_query=all:{query}&start=0&max_results={limit}"
                )
                try:
                    resp = await client.get(url)
                    resp.raise_for_status()
                except httpx.HTTPError as exc:
                    log.warning("arXiv query failed for '%s': %s", phrase, exc)
                    continue

                ns = {"a": "http://www.w3.org/2005/Atom"}
                root = ET.fromstring(resp.text)
                for entry in root.findall("a:entry", ns):
                    title_el = entry.find("a:title", ns)
                    summary_el = entry.find("a:summary", ns)
                    link_el = entry.find("a:id", ns)
                    authors = [a.findtext("a:name", "", ns) for a in entry.findall("a:author", ns)]
                    published = entry.findtext("a:published", "", ns)
                    _merge(
                        docs,
                        {
                            "source_title": (title_el.text or "").strip().replace("\n", " "),
                            "source_url": (link_el.text or "").strip(),
                            "author": ", ".join(a for a in authors if a)[:200],
                            "text": (summary_el.text or "").strip().replace("\n", " "),
                            "published_at": published[:10],
                        },
                        seen,
                    )
        self.cache.set(cache_key, docs)
        return docs

    # -------------------------------------------------------------- wikipedia
    async def search_wikipedia(self, keywords: list[str], limit: int = 3) -> list[dict]:
        docs: list[dict] = []
        seen: set[str] = set()
        phrases = [_core_phrase(k, 2) for k in keywords[:3]]
        cache_key = f"wiki:{'|'.join(phrases)}"
        if cached := self.cache.get(cache_key):
            return cached

        async with httpx.AsyncClient(headers=_UA, timeout=15) as client:
            for phrase in phrases:
                search_resp = await client.get(
                    "https://en.wikipedia.org/w/rest.php/v1/search/page",
                    params={"q": phrase, "limit": limit},
                )
                search_resp.raise_for_status()
                pages = search_resp.json().get("pages", [])

                for page in pages:
                    title = page.get("title", "")
                    key = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                    if key in seen:
                        continue
                    # Pull the full plain-text extract so lessons ground on real
                    # content, not the ~2-sentence search snippet.
                    text = await self._wikipedia_extract(client, title)
                    seen.add(key)
                    docs.append(
                        {
                            "source_title": f"Wikipedia — {title}",
                            "source_url": key,
                            "author": "Wikipedia contributors",
                            "text": text,
                            "published_at": None,
                        }
                    )
        self.cache.set(cache_key, docs)
        return docs

    async def _wikipedia_extract(self, client: httpx.AsyncClient, title: str) -> str:
        """Full plaintext extract via the MediaWiki action API."""
        try:
            resp = await client.get(
                "https://en.wikipedia.org/w/api.php",
                params={
                    "action": "query",
                    "prop": "extracts",
                    "explaintext": 1,
                    "redirects": 1,
                    "titles": title,
                    "format": "json",
                },
            )
            resp.raise_for_status()
            pages = resp.json().get("query", {}).get("pages", {})
            for page in pages.values():
                extract = page.get("extract") or ""
                if extract:
                    return extract[:12000]
        except httpx.HTTPError as exc:
            log.warning("Wikipedia extract failed for %s: %s", title, exc)
        return ""

    # ---------------------------------------------------------------- openalex
    async def search_openalex(self, keywords: list[str], limit: int = 3) -> list[dict]:
        """OpenAlex — free scholarly index of 250M+ journal works (no key)."""
        docs: list[dict] = []
        seen: set[str] = set()
        phrases = [_core_phrase(k) for k in keywords[:3]]
        cache_key = f"openalex:{'|'.join(phrases)}"
        if cached := self.cache.get(cache_key):
            return cached

        try:
            async with httpx.AsyncClient(headers=_UA, timeout=15) as client:
                for phrase in phrases:
                    resp = await client.get(
                        "https://api.openalex.org/works",
                        params={
                            "search": phrase,
                            "per-page": limit,
                            "sort": "relevance_score:desc",
                            "mailto": "research@fidya.ai",
                        },
                    )
                    resp.raise_for_status()
                    for work in resp.json().get("results", []):
                        abstract_inv = work.get("abstract_inverted_index")
                        if not abstract_inv:
                            continue
                        # Rebuild abstract from inverted index positions.
                        positions: dict[int, str] = {}
                        for word, idxs in abstract_inv.items():
                            for i in idxs:
                                positions[i] = word
                        abstract = " ".join(positions[i] for i in sorted(positions))
                        authors = [
                            a.get("author", {}).get("display_name", "")
                            for a in (work.get("authorships") or [])[:6]
                        ]
                        doi = work.get("doi") or ""
                        _merge(
                            docs,
                            {
                                "source_title": work.get("title") or "",
                                "source_url": doi or (work.get("id") or ""),
                                "author": ", ".join(a for a in authors if a)[:200],
                                "text": abstract,
                                "published_at": str(work.get("publication_year") or "") or None,
                            },
                            seen,
                        )
        except httpx.HTTPError as exc:
            log.warning("OpenAlex unreachable: %s", exc)

        self.cache.set(cache_key, docs)
        return docs

    # ------------------------------------------------------------------- doaj
    async def search_doaj(self, keywords: list[str], limit: int = 3) -> list[dict]:
        """DOAJ — peer-reviewed open-access journal articles (no key)."""
        docs: list[dict] = []
        seen: set[str] = set()
        phrases = [_core_phrase(k) for k in keywords[:3]]
        cache_key = f"doaj:{'|'.join(phrases)}"
        if cached := self.cache.get(cache_key):
            return cached

        try:
            async with httpx.AsyncClient(headers=_UA, timeout=15) as client:
                for phrase in phrases:
                    resp = await client.get(
                        f"https://doaj.org/api/search/articles/{quote(phrase)}",
                        params={"pageSize": limit},
                    )
                    resp.raise_for_status()
                    for article in resp.json().get("results", []):
                        bib = article.get("bibjson", {})
                        abstract = (bib.get("abstract") or "").strip()
                        if not abstract:
                            continue
                        authors = [
                            a.get("name", "") for a in (bib.get("author") or [])[:6]
                        ]
                        link = next(
                            (l.get("url", "") for l in bib.get("link", []) if l.get("type") == "fulltext"),
                            "",
                        )
                        journal = bib.get("journal", {}).get("title", "")
                        title = bib.get("title") or ""
                        _merge(
                            docs,
                            {
                                "source_title": f"{title} — {journal}" if journal else title,
                                "source_url": link,
                                "author": ", ".join(a for a in authors if a)[:200],
                                "text": abstract,
                                "published_at": (bib.get("year") and str(bib["year"])) or None,
                            },
                            seen,
                        )
        except httpx.HTTPError as exc:
            log.warning("DOAJ unreachable: %s", exc)

        self.cache.set(cache_key, docs)
        return docs

    # ------------------------------------------------------------- europe pmc
    async def search_europe_pmc(self, keywords: list[str], limit: int = 3) -> list[dict]:
        """Europe PMC — peer-reviewed life-science & multidisciplinary papers."""
        docs: list[dict] = []
        seen: set[str] = set()
        phrases = [_core_phrase(k) for k in keywords[:3]]
        cache_key = f"epmc:{'|'.join(phrases)}"
        if cached := self.cache.get(cache_key):
            return cached

        try:
            async with httpx.AsyncClient(headers=_UA, timeout=15) as client:
                for phrase in phrases:
                    resp = await client.get(
                        "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
                        params={
                            "query": f'({quote(phrase)}) AND (OPEN_ACCESS:y)',
                            "format": "json",
                            "pageSize": limit,
                            "resultType": "core",
                        },
                    )
                    resp.raise_for_status()
                    for paper in resp.json().get("resultList", {}).get("result", []):
                        abstract = (paper.get("abstractText") or "").strip()
                        if not abstract:
                            continue
                        authors = paper.get("authorString", "")
                        pmid = paper.get("pmid", "")
                        doi = paper.get("doi", "")
                        url = (
                            f"https://europepmc.org/article/MED/{pmid}"
                            if pmid
                            else (f"https://doi.org/{doi}" if doi else "")
                        )
                        _merge(
                            docs,
                            {
                                "source_title": paper.get("title") or "",
                                "source_url": url,
                                "author": authors[:200],
                                "text": abstract,
                                "published_at": paper.get("firstPublicationDate")
                                or paper.get("pubYear"),
                            },
                            seen,
                        )
        except httpx.HTTPError as exc:
            log.warning("Europe PMC unreachable: %s", exc)

        self.cache.set(cache_key, docs)
        return docs

    # ------------------------------------------------------- semantic scholar
    async def search_semantic_scholar(self, keywords: list[str], limit: int = 3) -> list[dict]:
        docs: list[dict] = []
        seen: set[str] = set()
        phrases = [_core_phrase(k) for k in keywords[:3]]
        cache_key = f"s2:{'|'.join(phrases)}"
        if cached := self.cache.get(cache_key):
            return cached

        try:
            async with httpx.AsyncClient(headers=_UA, timeout=15) as client:
                for phrase in phrases:
                    resp = await client.get(
                        "https://api.semanticscholar.org/graph/v1/paper/search",
                        params={
                            "query": phrase,
                            "limit": limit,
                            "fields": "title,abstract,url,authors,year,externalIds",
                        },
                    )
                    if resp.status_code == 429:
                        log.warning("Semantic Scholar rate-limited; skipping")
                        continue
                    resp.raise_for_status()
                    for paper in resp.json().get("data", []):
                        abstract = paper.get("abstract") or ""
                        if not abstract:
                            continue
                        authors = [a.get("name", "") for a in paper.get("authors", [])]
                        doi = (paper.get("externalIds") or {}).get("DOI")
                        _merge(
                            docs,
                            {
                                "source_title": paper.get("title", ""),
                                "source_url": f"https://doi.org/{doi}" if doi else paper.get("url", ""),
                                "author": ", ".join(authors)[:200],
                                "text": abstract,
                                "published_at": str(paper.get("year") or "") or None,
                            },
                            seen,
                        )
        except httpx.HTTPError as exc:
            log.warning("Semantic Scholar unreachable: %s", exc)

        self.cache.set(cache_key, docs)
        return docs


@lru_cache
def get_hunter() -> Hunter:
    return Hunter()
