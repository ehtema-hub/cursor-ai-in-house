import pytest

from app import create_app
from app.extensions import db
from app.support.seed import seed_support_users


@pytest.fixture
def app():
    app = create_app("testing")
    with app.app_context():
        db.create_all()
        seed_support_users()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _login(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['access_token']}"}


def test_create_ticket_and_list(client):
    headers = _login(client, "customer@support.local", "CustomerPass123!")
    response = client.post(
        "/api/tickets/",
        json={
            "subject": "Billing question about invoice",
            "description": "I need help understanding the latest invoice charges on my account.",
            "priority": "medium",
            "category": "billing",
            "customer_email": "customer@support.local",
        },
        headers=headers,
    )
    assert response.status_code == 201
    payload = response.get_json()
    assert payload["ticket_number"].startswith("TICK-")

    list_response = client.get("/api/tickets/", headers=headers)
    assert list_response.status_code == 200
    assert list_response.get_json()["meta"]["total"] >= 1


def test_validation_error_format(client):
    headers = _login(client, "customer@support.local", "CustomerPass123!")
    response = client.post(
        "/api/tickets/",
        json={
            "subject": "bad",
            "description": "too short",
            "category": "billing",
            "customer_email": "invalid",
        },
        headers=headers,
    )
    body = response.get_json()
    assert response.status_code == 400
    assert body["status"] == "error"
    assert body["code"] == "VALIDATION_ERROR"
    assert "errors" in body


def test_admin_dashboard(client):
    headers = _login(client, "admin@support.local", "AdminPass123!")
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 200
    assert "total_tickets" in response.get_json()


def test_customer_cannot_access_admin_dashboard(client):
    headers = _login(client, "customer@support.local", "CustomerPass123!")
    response = client.get("/api/admin/dashboard", headers=headers)
    assert response.status_code == 403
    assert response.get_json()["code"] == "FORBIDDEN"
