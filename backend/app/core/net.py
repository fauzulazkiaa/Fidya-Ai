"""Network resilience helpers.

Some carrier/CGNAT networks resolve dual-stack hosts to NAT64 IPv6
(`64:ff9b::/96`) addresses whose gateways silently drop TCP connects.
Python's socket.create_connection walks getaddrinfo results in order, so a
dead NAT64 gateway stalls every outbound request (Supabase, Gemini, Qdrant)
until timeout — while curl survives because it implements happy-eyeballs.

Sorting resolved addresses IPv4-first restores reliable connectivity without
breaking IPv6-only networks (v6 entries remain as fallback).
"""

from __future__ import annotations

import socket

_original_getaddrinfo = socket.getaddrinfo


def _ipv4_first_getaddrinfo(*args, **kwargs):
    results = _original_getaddrinfo(*args, **kwargs)
    return sorted(results, key=lambda ai: 0 if ai[0] == socket.AF_INET else 1)


_applied = False


def prefer_ipv4() -> None:
    """Install the IPv4-first resolver ordering (idempotent)."""
    global _applied
    if _applied:
        return
    socket.getaddrinfo = _ipv4_first_getaddrinfo
    _applied = True
