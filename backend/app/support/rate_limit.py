import time
from collections import defaultdict
from threading import Lock

from flask import g, request

from app.support.errors import SupportAPIError


class RateLimiter:
    def __init__(self, max_requests: int = 100, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)
        self._lock = Lock()

    def _key(self) -> str:
        user_id = getattr(g, "rate_limit_user_id", None)
        if user_id:
            return f"user:{user_id}"
        return f"ip:{request.remote_addr or 'unknown'}"

    def check(self) -> None:
        now = time.time()
        key = self._key()
        with self._lock:
            window_start = now - self.window_seconds
            self._hits[key] = [t for t in self._hits[key] if t > window_start]
            if len(self._hits[key]) >= self.max_requests:
                raise SupportAPIError(
                    "Too many requests. Please try again later.",
                    "RATE_LIMIT_EXCEEDED",
                    429,
                )
            self._hits[key].append(now)


rate_limiter = RateLimiter()
