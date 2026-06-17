def test_register_and_login(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New User",
            "email": "newuser@test.local",
            "password": "SecurePass123!",
        },
    )
    assert response.status_code == 201
    assert response.get_json()["email"] == "newuser@test.local"

    login = client.post(
        "/api/auth/login",
        json={"email": "newuser@test.local", "password": "SecurePass123!"},
    )
    assert login.status_code == 200
    assert "access_token" in login.get_json()


def test_register_duplicate_email(client, owner):
    response = client.post(
        "/api/auth/register",
        json={"name": "Dup", "email": owner.email, "password": "SecurePass123!"},
    )
    assert response.status_code == 409


def test_login_invalid_credentials(client, owner):
    response = client.post(
        "/api/auth/login",
        json={"email": owner.email, "password": "wrong-password"},
    )
    assert response.status_code == 401


def test_auth_me(client, owner_auth, owner):
    response = client.get("/api/auth/me", headers=owner_auth)
    assert response.status_code == 200
    assert response.get_json()["email"] == owner.email


def test_logout(client, owner_auth):
    response = client.post("/api/auth/logout", headers=owner_auth)
    assert response.status_code == 200
