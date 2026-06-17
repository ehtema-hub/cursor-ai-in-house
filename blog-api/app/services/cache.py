"""Redis-backed cache layer with in-memory fallback for tests."""

from __future__ import annotations

import json
from typing import Any


class CacheService:
    PREFIX = "blog:"

    def __init__(self):
        self._redis = None
        self._memory: dict[str, Any] = {}

    def init_app(self, app) -> None:
        if app.config.get("TESTING") and app.config.get("CACHE_USE_FAKE_REDIS"):
            try:
                import fakeredis

                self._redis = fakeredis.FakeRedis(decode_responses=True)
                return
            except ImportError:
                pass

        if app.config.get("TESTING") and not app.config.get("CACHE_USE_REDIS_IN_TESTS"):
            self._redis = None
            return

        redis_url = app.config.get("REDIS_URL")
        if not redis_url:
            self._redis = None
            return

        try:
            import redis

            client = redis.from_url(redis_url, decode_responses=True)
            client.ping()
            self._redis = client
        except Exception:
            app.logger.warning("Redis unavailable; using in-memory cache fallback.")
            self._redis = None

    def use_fake_redis(self) -> None:
        import fakeredis

        self._redis = fakeredis.FakeRedis(decode_responses=True)
        self._memory.clear()

    def _full_key(self, key: str) -> str:
        return f"{self.PREFIX}{key}"

    def get(self, key: str) -> Any | None:
        full = self._full_key(key)
        if self._redis is not None:
            raw = self._redis.get(full)
            if raw is None:
                return None
            return json.loads(raw)

        return self._memory.get(full)

    def set(self, key: str, value: Any, timeout: int | None = 300) -> None:
        full = self._full_key(key)
        payload = json.dumps(value, default=str)

        if self._redis is not None:
            if timeout:
                self._redis.setex(full, timeout, payload)
            else:
                self._redis.set(full, payload)
            return

        self._memory[full] = value

    def delete(self, key: str) -> None:
        full = self._full_key(key)
        if self._redis is not None:
            self._redis.delete(full)
        self._memory.pop(full, None)

    def delete_pattern(self, pattern: str) -> int:
        full_pattern = self._full_key(pattern)
        deleted = 0

        if self._redis is not None:
            for key in self._redis.scan_iter(match=full_pattern):
                self._redis.delete(key)
                deleted += 1
            return deleted

        prefix = full_pattern.rstrip("*")
        keys = [k for k in list(self._memory) if k.startswith(prefix)]
        for key in keys:
            del self._memory[key]
            deleted += 1
        return deleted

    def flush_all(self) -> None:
        if self._redis is not None:
            self._redis.flushdb()
        self._memory.clear()


cache = CacheService()


def posts_page_key(page: int) -> str:
    return f"posts:page:{page}"


def post_detail_key(post_id: int) -> str:
    return f"post:id:{post_id}"


def invalidate_post_detail(post_id: int) -> None:
    cache.delete(post_detail_key(post_id))


def invalidate_all_post_listings() -> int:
    return cache.delete_pattern("posts:page:*")


def invalidate_post_caches(post_id: int | None = None) -> None:
    """Invalidate listing caches and optionally a single post detail cache."""
    invalidate_all_post_listings()
    if post_id is not None:
        invalidate_post_detail(post_id)
