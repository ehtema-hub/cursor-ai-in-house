from unittest.mock import MagicMock, patch

from app.services.cache import CacheService, cache, invalidate_post_caches, post_detail_key, posts_page_key


def test_cache_service_memory_fallback():
    service = CacheService()
    service.set("demo", {"value": 1}, timeout=60)
    assert service.get("demo") == {"value": 1}
    service.delete("demo")
    assert service.get("demo") is None


def test_cache_delete_pattern_memory():
    service = CacheService()
    service.set("posts:page:1", {"items": []})
    service.set("posts:page:2", {"items": []})
    deleted = service.delete_pattern("posts:page:*")
    assert deleted == 2


def test_invalidate_post_caches_clears_keys():
    cache.set(posts_page_key(1), {"items": []})
    cache.set(post_detail_key(5), {"id": 5})
    invalidate_post_caches(5)
    assert cache.get(posts_page_key(1)) is None
    assert cache.get(post_detail_key(5)) is None


def test_fetch_paginated_posts_returns_cache_flag(app, sample_post):
    from app.services.post_service import fetch_paginated_posts

    with app.app_context():
        payload, from_cache = fetch_paginated_posts(1)
        assert from_cache is False
        assert len(payload["items"]) == 1

        payload2, from_cache2 = fetch_paginated_posts(1)
        assert from_cache2 is True
        assert payload2["items"][0]["id"] == sample_post.id


def test_cache_redis_setex(app):
    service = CacheService()
    mock_redis = MagicMock()
    service._redis = mock_redis
    service.set("key", {"a": 1}, timeout=120)
    mock_redis.setex.assert_called_once()
