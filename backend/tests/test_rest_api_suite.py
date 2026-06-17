"""
Comprehensive REST API test suite: users, products, orders.

Covers GET/POST/PUT/DELETE, authentication, authorization, validation,
error responses, rate limiting, and performance (<500ms).
"""

import time

import pytest

from app.extensions import db
from app.models.product import Product
from app.models.user import User
from tests.conftest import auth_headers

# --- Fixtures ---

SAMPLE_PRODUCT = {
    "sku": "HEAD-001",
    "name": "Aura Wireless Headphones",
    "description": "Premium noise-cancelling headphones.",
    "price": "149.99",
    "category": "electronics",
    "stock_quantity": 50,
}

SAMPLE_PRODUCT_2 = {
    "sku": "MUG-004",
    "name": "Stoneware Mug Set",
    "description": "Four-pack ceramic mugs.",
    "price": "33.00",
    "category": "home",
    "stock_quantity": 100,
}


@pytest.fixture
def admin_user(app):
    user = User(name="API Admin", email="admin@api.test", role="admin")
    user.set_password("AdminPass123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def customer_user(app):
    user = User(name="API Customer", email="customer@api.test", role="customer")
    user.set_password("CustomerPass123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def admin_auth(client, admin_user):
    return auth_headers(client, admin_user.email, "AdminPass123!")


@pytest.fixture
def customer_auth(client, customer_user):
    return auth_headers(client, customer_user.email, "CustomerPass123!")


@pytest.fixture
def seed_product(app, admin_auth, client):
    response = client.post("/api/products/", json=SAMPLE_PRODUCT, headers=admin_auth)
    assert response.status_code == 201
    return response.get_json()


@pytest.fixture
def seed_products(app, admin_auth, client):
    p1 = client.post("/api/products/", json=SAMPLE_PRODUCT, headers=admin_auth).get_json()
    p2 = client.post("/api/products/", json=SAMPLE_PRODUCT_2, headers=admin_auth).get_json()
    return p1, p2


def assert_error_shape(response, status_code):
    assert response.status_code == status_code
    body = response.get_json()
    assert body.get("status") == "error" or "message" in body
    assert "code" in body or status_code in (401, 403, 404)


def assert_response_time(response, max_ms=500):
    start = getattr(response, "_elapsed", None)
    if start is None:
        return
    assert response._elapsed < max_ms / 1000.0


# ==================== USER MANAGEMENT ====================


class TestUserManagement:
    def test_post_register(self, client):
        response = client.post(
            "/api/auth/register",
            json={"name": "New User", "email": "new@api.test", "password": "SecurePass123!"},
        )
        assert response.status_code == 201
        assert response.get_json()["email"] == "new@api.test"

    def test_get_users_me(self, client, customer_auth, customer_user):
        response = client.get("/api/users/me", headers=customer_auth)
        assert response.status_code == 200
        assert response.get_json()["email"] == customer_user.email

    def test_put_users_me(self, client, customer_auth):
        response = client.put(
            "/api/users/me",
            json={"name": "Updated Name"},
            headers=customer_auth,
        )
        assert response.status_code == 200
        assert response.get_json()["name"] == "Updated Name"

    def test_delete_users_me(self, client, customer_auth, customer_user):
        response = client.delete("/api/users/me", headers=customer_auth)
        assert response.status_code == 204
        db.session.refresh(customer_user)
        assert customer_user.is_active is False

    def test_get_user_by_id_forbidden(self, client, customer_auth, admin_user):
        response = client.get(f"/api/users/{admin_user.id}", headers=customer_auth)
        assert response.status_code == 403

    def test_put_user_admin_only(self, client, customer_auth, admin_user):
        response = client.put(
            f"/api/users/{admin_user.id}",
            json={"name": "Hacked"},
            headers=customer_auth,
        )
        assert response.status_code == 403

    def test_register_validation_error(self, client):
        response = client.post(
            "/api/auth/register",
            json={"name": "X", "email": "bad", "password": "short"},
        )
        assert response.status_code in (400, 422)

    def test_unauthenticated_users_me(self, client):
        assert client.get("/api/users/me").status_code == 401


# ==================== PRODUCT CATALOG ====================


class TestProductCatalog:
    def test_get_products_public(self, client, seed_product):
        start = time.perf_counter()
        response = client.get("/api/products/")
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert response.status_code == 200
        assert len(response.get_json()) >= 1
        assert elapsed_ms < 500

    def test_get_product_by_id(self, client, seed_product):
        pid = seed_product["id"]
        response = client.get(f"/api/products/{pid}")
        assert response.status_code == 200
        assert response.get_json()["sku"] == SAMPLE_PRODUCT["sku"]

    def test_post_product_admin(self, client, admin_auth):
        response = client.post("/api/products/", json=SAMPLE_PRODUCT_2, headers=admin_auth)
        assert response.status_code == 201

    def test_post_product_forbidden_customer(self, client, customer_auth):
        response = client.post("/api/products/", json=SAMPLE_PRODUCT, headers=customer_auth)
        assert response.status_code == 403

    def test_put_product_admin(self, client, admin_auth, seed_product):
        pid = seed_product["id"]
        response = client.put(
            f"/api/products/{pid}",
            json={"name": "Updated Headphones", "price": "159.99"},
            headers=admin_auth,
        )
        assert response.status_code == 200
        assert response.get_json()["name"] == "Updated Headphones"

    def test_delete_product_soft_delete(self, client, admin_auth, seed_product):
        pid = seed_product["id"]
        response = client.delete(f"/api/products/{pid}", headers=admin_auth)
        assert response.status_code == 204
        hidden = client.get(f"/api/products/{pid}")
        assert hidden.status_code == 404

    def test_get_product_not_found(self, client):
        assert client.get("/api/products/99999").status_code == 404

    def test_post_product_duplicate_sku(self, client, admin_auth, seed_product):
        response = client.post("/api/products/", json=SAMPLE_PRODUCT, headers=admin_auth)
        assert response.status_code == 409

    def test_post_product_validation(self, client, admin_auth):
        response = client.post(
            "/api/products/",
            json={"sku": "X", "name": "Y", "price": "-1"},
            headers=admin_auth,
        )
        assert response.status_code in (400, 422)

    def test_filter_products_by_category(self, client, seed_products):
        response = client.get("/api/products/?category=electronics")
        assert response.status_code == 200
        assert all(p["category"] == "electronics" for p in response.get_json())


# ==================== ORDERS ====================


class TestOrders:
    def test_post_order(self, client, customer_auth, seed_product):
        response = client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 2}]},
            headers=customer_auth,
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["status"] == "pending"
        assert float(data["total_amount"]) == pytest.approx(299.98, rel=0.01)
        assert len(data["items"]) == 1

    def test_get_orders_own(self, client, customer_auth, seed_product):
        client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 1}]},
            headers=customer_auth,
        )
        response = client.get("/api/orders/", headers=customer_auth)
        assert response.status_code == 200
        assert len(response.get_json()) >= 1

    def test_get_order_by_id(self, client, customer_auth, seed_product):
        create = client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 1}]},
            headers=customer_auth,
        )
        oid = create.get_json()["id"]
        response = client.get(f"/api/orders/{oid}", headers=customer_auth)
        assert response.status_code == 200

    def test_get_order_forbidden_other_user(self, client, customer_auth, owner_auth, seed_product):
        create = client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 1}]},
            headers=customer_auth,
        )
        oid = create.get_json()["id"]
        response = client.get(f"/api/orders/{oid}", headers=owner_auth)
        assert response.status_code == 403

    def test_get_order_admin_can_view_any(self, client, customer_auth, admin_auth, seed_product):
        create = client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 1}]},
            headers=customer_auth,
        )
        oid = create.get_json()["id"]
        response = client.get(f"/api/orders/{oid}", headers=admin_auth)
        assert response.status_code == 200

    def test_put_order_status_admin(self, client, admin_auth, customer_auth, seed_product):
        create = client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 1}]},
            headers=customer_auth,
        )
        oid = create.get_json()["id"]
        response = client.put(
            f"/api/orders/{oid}",
            json={"status": "confirmed"},
            headers=admin_auth,
        )
        assert response.status_code == 200
        assert response.get_json()["status"] == "confirmed"

    def test_put_order_status_forbidden_customer(self, client, customer_auth, seed_product):
        create = client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 1}]},
            headers=customer_auth,
        )
        oid = create.get_json()["id"]
        response = client.put(
            f"/api/orders/{oid}",
            json={"status": "shipped"},
            headers=customer_auth,
        )
        assert response.status_code == 403

    def test_delete_order_cancel(self, client, customer_auth, seed_product):
        create = client.post(
            "/api/orders/",
            json={"items": [{"product_id": seed_product["id"], "quantity": 1}]},
            headers=customer_auth,
        )
        oid = create.get_json()["id"]
        response = client.delete(f"/api/orders/{oid}", headers=customer_auth)
        assert response.status_code == 204

    def test_post_order_empty_items(self, client, customer_auth):
        response = client.post("/api/orders/", json={"items": []}, headers=customer_auth)
        assert response.status_code in (400, 422)

    def test_post_order_insufficient_stock(self, client, customer_auth, admin_auth):
        product = client.post(
            "/api/products/",
            json={**SAMPLE_PRODUCT, "sku": "LOW-STOCK", "stock_quantity": 1},
            headers=admin_auth,
        ).get_json()
        response = client.post(
            "/api/orders/",
            json={"items": [{"product_id": product["id"], "quantity": 99}]},
            headers=customer_auth,
        )
        assert response.status_code == 400

    def test_orders_unauthenticated(self, client):
        assert client.get("/api/orders/").status_code == 401


# ==================== CROSS-CUTTING: AUTH, RATE LIMIT, PERFORMANCE ====================


class TestCrossCutting:
    def test_invalid_token(self, client):
        response = client.get(
            "/api/orders/",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        assert response.status_code in (401, 422)

    def test_error_response_format_not_found(self, client):
        response = client.get("/api/products/99999")
        body = response.get_json()
        assert response.status_code == 404
        assert body.get("code") == "NOT_FOUND" or body.get("status") == "error"

    def test_rate_limit_exceeded(self, client, customer_auth, app):
        app.config["RATE_LIMIT_MAX_REQUESTS"] = 3
        app.config["RATE_LIMIT_WINDOW_SECONDS"] = 60
        from app.support.rate_limit import rate_limiter

        rate_limiter.max_requests = 3
        rate_limiter.window_seconds = 60
        rate_limiter._hits.clear()

        for _ in range(3):
            assert client.get("/api/orders/", headers=customer_auth).status_code == 200
        response = client.get("/api/orders/", headers=customer_auth)
        assert response.status_code == 429
        assert response.get_json().get("code") == "RATE_LIMIT_EXCEEDED"

    def test_performance_products_list(self, client, seed_product):
        start = time.perf_counter()
        for _ in range(5):
            response = client.get("/api/products/")
            assert response.status_code == 200
        avg_ms = ((time.perf_counter() - start) / 5) * 1000
        assert avg_ms < 500

    def test_performance_auth_me(self, client, customer_auth):
        start = time.perf_counter()
        response = client.get("/api/users/me", headers=customer_auth)
        elapsed_ms = (time.perf_counter() - start) * 1000
        assert response.status_code == 200
        assert elapsed_ms < 500

    def test_sql_injection_product_id(self, client):
        response = client.get("/api/products/1;%20DROP%20TABLE%20products;--")
        assert response.status_code in (404, 422)
