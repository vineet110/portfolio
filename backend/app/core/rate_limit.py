"""In-memory sliding-window rate limiter — deliberately simple for an MVP.

Runs per-process, so on a serverless platform (Vercel Functions) with
multiple concurrent instances or cold starts this is a soft limit, not an
authoritative one — good enough to blunt a casual abuse burst against
`/api/chat` without adding Redis or any other infrastructure. Revisit with
a shared store (e.g. Upstash Redis) if it ever needs to be authoritative.
"""

import threading
import time
from collections import defaultdict

from fastapi import HTTPException, Request

_WINDOW_SECONDS = 60.0
_MAX_REQUESTS_PER_WINDOW = 20

_lock = threading.Lock()
_request_log: dict[str, list[float]] = defaultdict(list)


def enforce_rate_limit(request: Request) -> None:
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    cutoff = now - _WINDOW_SECONDS

    with _lock:
        timestamps = _request_log[client_ip]
        while timestamps and timestamps[0] < cutoff:
            timestamps.pop(0)

        if len(timestamps) >= _MAX_REQUESTS_PER_WINDOW:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please slow down and try again shortly.",
            )

        timestamps.append(now)
