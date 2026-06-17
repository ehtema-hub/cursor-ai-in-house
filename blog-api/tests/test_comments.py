def test_comment_create_and_list(client, author_headers, sample_post):
    create = client.post(
        f"/api/posts/{sample_post.id}/comments",
        json={"content": "Excellent write-up, thanks for sharing!"},
        headers=author_headers,
    )
    assert create.status_code == 201
    assert create.get_json()["content"].startswith("Excellent")

    listing = client.get(f"/api/posts/{sample_post.id}/comments")
    assert listing.status_code == 200
    assert len(listing.get_json()) == 1


def test_comment_on_missing_post(client, author_headers):
    response = client.post(
        "/api/posts/9999/comments",
        json={"content": "This comment targets a post that does not exist."},
        headers=author_headers,
    )
    assert response.status_code == 404


def test_comment_requires_authentication(client, sample_post):
    response = client.post(
        f"/api/posts/{sample_post.id}/comments",
        json={"content": "Anonymous comments are not allowed here."},
    )
    assert response.status_code == 401


def test_list_categories(client, category):
    response = client.get("/api/categories")
    assert response.status_code == 200
    names = [item["name"] for item in response.get_json()]
    assert "Technology" in names
