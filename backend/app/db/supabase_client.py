"""Supabase access with a chainable in-memory fallback.

Both backends expose the same call shape:

    store.table("curricula").select("*").eq("id", cid).execute().data
    store.table("curricula").insert(payload).execute().data
    store.table("curricula").update(patch).eq("id", cid).execute().data

When SUPABASE_URL / SUPABASE_SERVICE_KEY are configured the official
supabase-py client is used; otherwise an in-process emulation keeps local
development and tests fully functional without external services.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger(__name__, "db")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Executed:
    def __init__(self, data: Any) -> None:
        self.data = data


class MemoryQuery:
    """Chainable query emulation mirroring postgrest-py semantics."""

    def __init__(self, table: "MemoryTable") -> None:
        self._table = table
        self._filters: list[tuple[str, Any]] = []
        self._payload: Any = None
        self._order_key: str | None = None
        self._order_desc: bool = False
        self._limit_val: int | None = None

    def select(self, *_columns: str) -> "MemoryQuery":
        return self

    def eq(self, column: str, value: Any) -> "MemoryQuery":
        self._filters.append(("eq", column, value))
        return self

    def neq(self, column: str, value: Any) -> "MemoryQuery":
        self._filters.append(("neq", column, value))
        return self

    def is_(self, column: str, value: Any) -> "MemoryQuery":
        """Filter where column IS null (value='null') or IS NOT null."""
        self._filters.append(("is", column, value))
        return self

    def like(self, column: str, pattern: str) -> "MemoryQuery":
        """Simple LIKE filter — only supports trailing wildcard `%`."""
        self._filters.append(("like", column, pattern))
        return self

    def order(self, column: str, *, desc: bool = False) -> "MemoryQuery":
        self._order_key = column
        self._order_desc = desc
        return self

    def limit(self, n: int) -> "MemoryQuery":
        self._limit_val = n
        return self

    def insert(self, payload: dict | list[dict]) -> "MemoryQuery":
        self._payload = payload
        return self

    def update(self, payload: dict) -> "MemoryQuery":
        self._payload = payload
        return self

    def delete(self) -> "MemoryQuery":
        self._payload = "__delete__"
        return self

    def _apply_filters(self, rows: list[dict]) -> list[dict]:
        import fnmatch
        for ftype, col, val in self._filters:
            if ftype == "eq":
                rows = [r for r in rows if r.get(col) == val]
            elif ftype == "neq":
                rows = [r for r in rows if r.get(col) != val]
            elif ftype == "is":
                if val == "null" or val is None:
                    rows = [r for r in rows if r.get(col) is None]
                else:
                    rows = [r for r in rows if r.get(col) is not None]
            elif ftype == "like":
                pattern = val.replace("%", "*")
                rows = [r for r in rows if fnmatch.fnmatch(str(r.get(col, "")), pattern)]
        return rows

    def execute(self) -> Executed:
        rows = self._apply_filters(list(self._table.rows))

        if self._payload == "__delete__":
            filtered_ids = {id(r) for r in rows}
            self._table.rows[:] = [r for r in self._table.rows if id(r) not in filtered_ids]
            return Executed([])
        if isinstance(self._payload, list):
            inserted = [{**p, "id": p.get("id", uuid.uuid4().hex), "created_at": _now()} for p in self._payload]
            self._table.rows.extend(inserted)
            return Executed(inserted)
        if isinstance(self._payload, dict):
            if rows:
                for r in rows:
                    r.update(self._payload)
                return Executed(rows)
            row = {**self._payload, "id": self._payload.get("id", uuid.uuid4().hex), "created_at": _now()}
            self._table.rows.append(row)
            return Executed([row])

        # SELECT path: apply ordering and limit
        if self._order_key:
            rows = sorted(rows, key=lambda r: r.get(self._order_key, ""), reverse=self._order_desc)
        if self._limit_val is not None:
            rows = rows[:self._limit_val]
        return Executed(rows)


class MemoryTable:
    def __init__(self) -> None:
        self.rows: list[dict[str, Any]] = []

    def select(self, *_columns: str) -> MemoryQuery:
        return MemoryQuery(self)

    def insert(self, payload: dict | list[dict]) -> MemoryQuery:
        return MemoryQuery(self).insert(payload)

    def update(self, payload: dict) -> MemoryQuery:
        return MemoryQuery(self).update(payload)

    def delete(self) -> MemoryQuery:
        return MemoryQuery(self).delete()


class MemoryDatabase:
    def __init__(self) -> None:
        self._tables: dict[str, MemoryTable] = {}

    def table(self, name: str) -> MemoryTable:
        return self._tables.setdefault(name, MemoryTable())


@lru_cache
def get_store() -> Any:
    """Return the Supabase client or an in-memory database."""
    if settings.has_supabase:
        from supabase import create_client  # pragma: no cover

        log.info("Using Supabase at %s", settings.supabase_url)
        return create_client(
            settings.supabase_url, settings.supabase_server_key
        )
    log.warning("SUPABASE_URL/SECRET_KEY missing — using in-memory store")
    return MemoryDatabase()


@lru_cache
def get_background_store() -> Any:
    """Dedicated client for long-running background threads.

    The sync supabase-py client wraps a single httpx connection pool that is
    NOT safe for concurrent use from multiple threads. Sharing the request
    handlers' client with the re-engagement sweep deadlocked the pool and
    hung the whole API — background work therefore gets its own instance."""
    if settings.has_supabase:
        from supabase import create_client  # pragma: no cover

        return create_client(
            settings.supabase_url, settings.supabase_server_key
        )
    return MemoryDatabase()
