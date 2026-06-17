"""Redis-backed caching with in-memory fallback for tests."""

from __future__ import annotations

import json
from typing import Any

from flask import current_app


class CacheService:
    """Thin wrapper around Redis with SimpleCache fallback."""

    def __init__(self, redis_client=None, prefix: str = "taskflow:"):
        self._redis = redis_client
        self._memory: dict[str, tuple[Any, float | None]] = {}
        self._prefix = prefix

    def init_app(self, app) -> None:
        if app.config.get("TESTING") and not app.config.get("CACHE_USE_REDIS_IN_TESTS"):
            self._redis = None
            return

        redis_url = app.config.get("REDIS_URL")
        if not redis_url:
            self._redis = None
            return

        try:
            import redis

            self._redis = redis.from_url(redis_url, decode_responses=True)
            self._redis.ping()
        except Exception:
            app.logger.warning("Redis unavailable; falling back to in-memory cache.")
            self._redis = None

    def _key(self, key: str) -> str:
        return f"{self._prefix}{key}"

    def get(self, key: str) -> Any | None:
        full = self._key(key)
        if self._redis is not None:
            value = self._redis.get(full)
            if value is None:
                return None
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        entry = self._memory.get(full)
        return entry[0] if entry else None

    def set(self, key: str, value: Any, timeout: int | None = 300) -> None:
        full = self._key(key)
        payload = json.dumps(value) if not isinstance(value, (str, int, float, bool)) else json.dumps(value)

        if self._redis is not None:
            if timeout:
                self._redis.setex(full, timeout, payload)
            else:
                self._redis.set(full, payload)
            return

        self._memory[full] = (value, timeout)

    def delete(self, key: str) -> None:
        full = self._key(key)
        if self._redis is not None:
            self._redis.delete(full)
        self._memory.pop(full, None)

    def delete_pattern(self, pattern: str) -> int:
        full_pattern = self._key(pattern)
        deleted = 0
        if self._redis is not None:
            for key in self._redis.scan_iter(match=full_pattern):
                self._redis.delete(key)
                deleted += 1
            return deleted

        to_remove = [k for k in self._memory if k.startswith(full_pattern.rstrip("*"))]
        for key in to_remove:
            del self._memory[key]
            deleted += 1
        return deleted

    def incr(self, key: str) -> int:
        full = self._key(key)
        if self._redis is not None:
            return int(self._redis.incr(full))
        current = self.get(key) or 0
        new_value = int(current) + 1
        self.set(key, new_value)
        return new_value


cache = CacheService()


def task_list_cache_key(user_id: int, filters: dict) -> str:
    parts = [
        str(user_id),
        str(filters.get("project_id") or ""),
        str(filters.get("status") or ""),
        str(filters.get("assignee_id") or ""),
        str(filters.get("priority") or ""),
    ]
    version = cache.get(f"tasks:ver:{user_id}") or 0
    return f"tasks:list:{user_id}:v{version}:{'|'.join(parts)}"


def bump_task_cache_version(user_id: int) -> None:
    cache.incr(f"tasks:ver:{user_id}")


def invalidate_project_task_caches(project_id: int) -> None:
    from app.models.project import Project, ProjectMember

    member_ids = [
        row.user_id for row in ProjectMember.query.filter_by(project_id=project_id).all()
    ]
    owner_id = Project.query.with_entities(Project.owner_id).filter_by(id=project_id).scalar()
    if owner_id:
        member_ids.append(owner_id)
    for user_id in set(member_ids):
        bump_task_cache_version(user_id)


def membership_cache_key(project_id: int, user_id: int) -> str:
    return f"member:{project_id}:{user_id}"


def unread_count_cache_key(user_id: int) -> str:
    return f"notif:unread:{user_id}"


def invalidate_unread_count(user_id: int) -> None:
    cache.delete(unread_count_cache_key(user_id))
