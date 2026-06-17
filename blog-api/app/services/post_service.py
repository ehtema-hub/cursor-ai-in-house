"""Post query and caching service."""

from __future__ import annotations

from flask import current_app

from app.extensions import db
from app.models import Post
from app.schemas import PaginatedPostsSchema, PostSchema
from app.services.cache import (
    cache,
    invalidate_post_caches,
    post_detail_key,
    posts_page_key,
)

post_schema = PostSchema()
paginated_posts_schema = PaginatedPostsSchema()


def _pagination_meta(pagination) -> dict:
    return {
        "total": pagination.total,
        "pages": pagination.pages,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "next_page": pagination.page + 1 if pagination.has_next else None,
        "prev_page": pagination.page - 1 if pagination.has_prev else None,
    }


def fetch_paginated_posts(page: int) -> tuple[dict, bool]:
    """Return paginated posts payload and whether it came from cache."""
    page = max(page, 1)
    key = posts_page_key(page)
    cached = cache.get(key)
    if cached is not None:
        return cached, True

    per_page = current_app.config["POSTS_PER_PAGE"]
    pagination = (
        Post.query.order_by(Post.created_at.desc())
        .paginate(page=page, per_page=per_page, error_out=False)
    )
    payload = {
        "items": pagination.items,
        "meta": _pagination_meta(pagination),
    }
    serialized = paginated_posts_schema.dump(payload)
    timeout = current_app.config.get("CACHE_DEFAULT_TIMEOUT", 300)
    cache.set(key, serialized, timeout=timeout)
    return serialized, False


def fetch_post_detail(post_id: int) -> tuple[dict | None, bool]:
    """Return single post payload and whether it came from cache."""
    key = post_detail_key(post_id)
    cached = cache.get(key)
    if cached is not None:
        return cached, True

    post = db.session.get(Post, post_id)
    if post is None:
        return None, False

    serialized = post_schema.dump(post)
    timeout = current_app.config.get("CACHE_DEFAULT_TIMEOUT", 300)
    cache.set(key, serialized, timeout=timeout)
    return serialized, False


def bust_caches_after_create() -> None:
    invalidate_post_caches()


def bust_caches_after_update(post_id: int) -> None:
    invalidate_post_caches(post_id)


def bust_caches_after_delete(post_id: int) -> None:
    invalidate_post_caches(post_id)
