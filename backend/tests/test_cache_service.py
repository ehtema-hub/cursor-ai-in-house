from app.services.cache import (
    bump_task_cache_version,
    cache,
    membership_cache_key,
    task_list_cache_key,
    unread_count_cache_key,
)


def test_cache_set_get_delete():
    cache.set("demo", {"value": 1}, timeout=60)
    assert cache.get("demo") == {"value": 1}
    cache.delete("demo")
    assert cache.get("demo") is None


def test_cache_incr():
    assert cache.incr("counter") == 1
    assert cache.incr("counter") == 2


def test_task_list_cache_key_changes_with_version():
    user_id = 42
    filters = {"project_id": 1, "status": "todo"}
    first = task_list_cache_key(user_id, filters)
    bump_task_cache_version(user_id)
    second = task_list_cache_key(user_id, filters)
    assert first != second


def test_delete_pattern():
    cache.set("tasks:list:1:v0:a", [1], timeout=60)
    cache.set("tasks:list:1:v0:b", [2], timeout=60)
    deleted = cache.delete_pattern("tasks:list:1:*")
    assert deleted == 2


def test_membership_and_unread_keys():
    assert membership_cache_key(1, 2) == "member:1:2"
    assert unread_count_cache_key(9) == "notif:unread:9"
