"""Structured logging with agent-ID + timestamp on every record (FR-1)."""

import logging
import sys

from app.core.config import settings


class FidyaFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        """Inject ``agent_id`` before the standard format string runs."""
        record.agent_id = getattr(record, "agent_id", "system")
        return super().format(record)


def setup_logging() -> None:
    """Attach the Fidya formatter (timestamp and agent id) to the root logger."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        FidyaFormatter(
            "%(asctime)s | %(levelname)-7s | %(agent_id)14s | %(name)s | %(message)s"
        )
    )
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.DEBUG if settings.debug else logging.INFO)


def get_logger(name: str, agent_id: str = "system") -> logging.LoggerAdapter:
    """Logger that stamps every record with ``agent_id``."""
    return logging.LoggerAdapter(logging.getLogger(name), {"agent_id": agent_id})
