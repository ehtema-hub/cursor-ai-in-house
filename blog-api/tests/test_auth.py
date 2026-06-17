def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "new@blog.local", "username": "newbie", "password": "SecurePass123!"},
    )
    assert response.status_code == 201
    body = response.get_json()
    assert body["email"] == "new@blog.local"
    assert body["username"] == "newbie"
    assert "password_hash" not in body


def test_register_duplicate_email(client, author):
    response = client.post(
        "/api/auth/register",
        json={"email": author.email, "username": "unique_name", "password": "SecurePass123!"},
    )
    assert response.status_code == 409
    assert "already exists" in response.get_json()["error"]


def test_register_short_password_validation(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "short@blog.local", "username": "shorty", "password": "abc"},
    )
    assert response.status_code == 400


def test_login_success(client, author):
    response = client.post(
        "/api/auth/login",
        json={"email": author.email, "password": "SecurePass123!"},
    )
    assert response.status_code == 200
    assert "access_token" in response.get_json()


def test_login_invalid_credentials(client, author):
    response = client.post(
        "/api/auth/login",
        json={"email": author.email, "password": "WrongPassword!"},
    )
    assert response.status_code == 401


def test_protected_create_post_requires_jwt(client, category):
    response = client.post(
        "/api/posts",
        json={
            "title": "Unauthorized Post",
            "content": "This should fail without a JWT token present.",
            "category_id": category.id,
        },
    )
    assert response.status_code == 401
