from unittest.mock import patch

from app.extensions import db
from app.models import Post
from app.services.cache import cache, post_detail_key, posts_page_key


def test_post_crud_lifecycle(client, author_headers, category):
    create = client.post(
        "/api/posts",
        json={
            "title": "Lifecycle Post",
            "content": "Full CRUD lifecycle test content for blog posts.",
            "category_id": category.id,
        },
        headers=author_headers,
    )
    assert create.status_code == 201
    post_id = create.get_json()["id"]

    detail = client.get(f"/api/posts/{post_id}")
    assert detail.status_code == 200
    assert detail.get_json()["title"] == "Lifecycle Post"

    update = client.put(
        f"/api/posts/{post_id}",
        json={"title": "Updated Lifecycle Post"},
        headers=author_headers,
    )
    assert update.status_code == 200
    assert update.get_json()["title"] == "Updated Lifecycle Post"

    delete = client.delete(f"/api/posts/{post_id}", headers=author_headers)
    assert delete.status_code == 200
    assert client.get(f"/api/posts/{post_id}").status_code == 404


def test_create_post_invalid_category(client, author_headers):
    response = client.post(
        "/api/posts",
        json={
            "title": "Missing Category",
            "content": "This post references a category that does not exist.",
            "category_id": 9999,
        },
        headers=author_headers,
    )
    assert response.status_code == 404


def test_create_post_validation_rejects_short_content(client, author_headers, category):
    response = client.post(
        "/api/posts",
        json={"title": "Bad", "content": "short", "category_id": category.id},
        headers=author_headers,
    )
    assert response.status_code == 400


def test_other_user_cannot_update_post(client, author_headers, other_headers, sample_post):
    response = client.put(
        f"/api/posts/{sample_post.id}",
        json={"title": "Hijacked Title"},
        headers=other_headers,
    )
    assert response.status_code == 403


def test_other_user_cannot_delete_post(client, other_headers, sample_post):
    response = client.delete(f"/api/posts/{sample_post.id}", headers=other_headers)
    assert response.status_code == 403


def test_pagination_limits_twenty_per_page(client, many_posts):
    response = client.get("/api/posts?page=1")
    assert response.status_code == 200
    body = response.get_json()
    assert len(body["items"]) == 20
    assert body["meta"]["per_page"] == 20
    assert body["meta"]["total"] == 25
    assert body["meta"]["pages"] == 2
    assert body["meta"]["next_page"] == 2

    page_two = client.get("/api/posts?page=2")
    assert len(page_two.get_json()["items"]) == 5


def test_list_posts_cache_hit_skips_database(client, sample_post):
    client.get("/api/posts?page=1")
    assert cache.get(posts_page_key(1)) is not None

    with patch.object(Post, "query") as mock_query:
        response = client.get("/api/posts?page=1")
        assert response.status_code == 200
        mock_query.order_by.assert_not_called()


def test_get_post_cache_hit_skips_database(client, sample_post):
    client.get(f"/api/posts/{sample_post.id}")
    assert cache.get(post_detail_key(sample_post.id)) is not None

    with patch("app.services.post_service.db.session.get") as mock_get:
        response = client.get(f"/api/posts/{sample_post.id}")
        assert response.status_code == 200
        mock_get.assert_not_called()


def test_put_invalidates_post_and_listing_cache(client, author_headers, sample_post):
    client.get("/api/posts?page=1")
    client.get(f"/api/posts/{sample_post.id}")
    assert cache.get(posts_page_key(1)) is not None
    assert cache.get(post_detail_key(sample_post.id)) is not None

    client.put(
        f"/api/posts/{sample_post.id}",
        json={"title": "Cache Bust Update"},
        headers=author_headers,
    )

    assert cache.get(posts_page_key(1)) is None
    assert cache.get(post_detail_key(sample_post.id)) is None


def test_delete_invalidates_post_and_listing_cache(client, author_headers, sample_post):
    client.get("/api/posts?page=1")
    client.get(f"/api/posts/{sample_post.id}")

    client.delete(f"/api/posts/{sample_post.id}", headers=author_headers)

    assert cache.get(posts_page_key(1)) is None
    assert cache.get(post_detail_key(sample_post.id)) is None


def test_create_invalidates_listing_cache(client, author_headers, category, sample_post):
    client.get("/api/posts?page=1")
    assert cache.get(posts_page_key(1)) is not None

    client.post(
        "/api/posts",
        json={
            "title": "Another Post",
            "content": "Creating this post should invalidate listing cache keys.",
            "category_id": category.id,
        },
        headers=author_headers,
    )

    assert cache.get(posts_page_key(1)) is None


def test_search_requires_query(client):
    assert client.get("/api/search").status_code == 400


def test_search_finds_matching_post(client, sample_post):
    response = client.get("/api/search?q=Cached")
    assert response.status_code == 200
    assert any(item["id"] == sample_post.id for item in response.get_json()["items"])
