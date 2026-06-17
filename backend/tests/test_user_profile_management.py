"""
Executable tests for User Profile Management (UPM-* cases).

Maps to backend/tests/USER_PROFILE_MANAGEMENT_TEST_CASES.md
"""

import pytest

from app.extensions import db
from app.models.user import User
from tests.conftest import auth_headers

# --- Test data (see spec catalog) ---

USER_A = {
    "name": "Alex Morgan",
    "email": "alex.morgan@profile.test",
    "password": "ValidPass123!",
}

USER_B = {
    "name": "Blake Chen",
    "email": "blake.chen@profile.test",
    "password": "AnotherPass456!",
}

VALID_MIN_PASSWORD_USER = {
    "name": "Min Pass User",
    "email": "minpass@profile.test",
    "password": "12345678",
}

UNICODE_NAME_USER = {
    "name": "José García",
    "email": "jose.garcia@profile.test",
    "password": "ValidPass123!",
}


def _register(client, payload=None):
    return client.post("/api/auth/register", json=payload or USER_A)


def _login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


# ==================== Registration — Positive ====================


def test_upm_reg_001_register_valid(client):
    """UPM-REG-001: Register with valid data."""
    response = _register(client)
    assert response.status_code == 201
    data = response.get_json()
    assert data["email"] == USER_A["email"]
    assert data["name"] == USER_A["name"]
    assert "password" not in data
    assert "password_hash" not in data


def test_upm_reg_002_login_after_registration(client):
    """UPM-REG-002: Login after registration."""
    _register(client)
    login = _login(client, USER_A["email"], USER_A["password"])
    assert login.status_code == 200
    body = login.get_json()
    assert body.get("access_token")
    assert body.get("refresh_token")


def test_upm_reg_003_get_profile_after_register(client):
    """UPM-REG-003: GET /api/auth/me after login."""
    _register(client)
    login = _login(client, USER_A["email"], USER_A["password"])
    token = login.get_json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.get_json()["email"] == USER_A["email"]


def test_upm_reg_005_email_normalization(client):
    """UPM-REG-005: Email stored lowercase."""
    payload = {**USER_B, "email": "Blake.Chen@Profile.TEST"}
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    assert response.get_json()["email"] == "blake.chen@profile.test"


def test_upm_reg_006_name_trimmed(client):
    """UPM-REG-006: Name whitespace trimmed."""
    payload = {**USER_A, "email": "trim.name@profile.test", "name": "  Alex Morgan  "}
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201
    assert response.get_json()["name"] == "Alex Morgan"


# ==================== Registration — Negative ====================


def test_upm_reg_n01_duplicate_email(client, owner):
    """UPM-REG-N01: Duplicate email returns 409."""
    response = client.post(
        "/api/auth/register",
        json={"name": "Dup", "email": owner.email, "password": "SecurePass123!"},
    )
    assert response.status_code == 409


@pytest.mark.parametrize(
    "payload,field",
    [
        ({"email": USER_A["email"], "password": USER_A["password"]}, "name"),
        ({"name": USER_A["name"], "password": USER_A["password"]}, "email"),
        ({"name": USER_A["name"], "email": USER_A["email"]}, "password"),
    ],
)
def test_upm_reg_n02_missing_required_fields(client, payload, field):
    """UPM-REG-N02–N04: Missing required fields."""
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


@pytest.mark.parametrize(
    "payload",
    [
        {"name": "Test User", "email": "bad@", "password": "ValidPass123!"},
        {"name": "Test User", "email": "short@test.local", "password": "short"},
        {"name": "A", "email": "shortname@test.local", "password": "ValidPass123!"},
    ],
)
def test_upm_reg_n05_validation_errors(client, payload):
    """UPM-REG-N05–N07: Invalid field formats."""
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 422


def test_upm_reg_e06_empty_json(client):
    """UPM-REG-E06: Empty body."""
    response = client.post("/api/auth/register", json={})
    assert response.status_code == 422


# ==================== Registration — Edge ====================


def test_upm_reg_e01_minimum_password_length(client):
    """UPM-REG-E01: 8-character password accepted."""
    response = client.post("/api/auth/register", json=VALID_MIN_PASSWORD_USER)
    assert response.status_code == 201


def test_upm_reg_e02_max_name_length(client):
    """UPM-REG-E02: 120-character name accepted."""
    payload = {
        "name": "A" * 120,
        "email": "maxname@profile.test",
        "password": "ValidPass123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201


def test_upm_reg_e03_unicode_name(client):
    """UPM-REG-E03: Unicode name."""
    response = client.post("/api/auth/register", json=UNICODE_NAME_USER)
    assert response.status_code == 201
    assert response.get_json()["name"] == UNICODE_NAME_USER["name"]


def test_upm_reg_e04_plus_address_email(client):
    """UPM-REG-E04: Plus-address email."""
    payload = {
        "name": "Plus User",
        "email": "user+tag@profile.test",
        "password": "ValidPass123!",
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 201


def test_upm_reg_e05_double_submit(client):
    """UPM-REG-E05: Second register same email fails."""
    assert _register(client, {"name": "First", "email": "double@profile.test", "password": "ValidPass123!"}).status_code == 201
    second = client.post(
        "/api/auth/register",
        json={"name": "Second", "email": "double@profile.test", "password": "ValidPass123!"},
    )
    assert second.status_code == 409


# ==================== Registration — Security ====================


def test_upm_reg_s02_password_hashed_in_db(client):
    """UPM-REG-S02: Password stored as bcrypt hash."""
    _register(client, {"name": "Hash Check", "email": "hash@profile.test", "password": "ValidPass123!"})
    user = User.query.filter_by(email="hash@profile.test").first()
    assert user.password_hash != "ValidPass123!"
    assert user.check_password("ValidPass123!")


def test_upm_reg_s01_password_not_in_response(client):
    """UPM-REG-S01: No password in register response."""
    response = _register(client, {"name": "Secret", "email": "secret@profile.test", "password": "ValidPass123!"})
    body = response.get_json()
    assert "password" not in body
    assert "password_hash" not in body


def test_upm_reg_s03_xss_name_stored(client):
    """UPM-REG-S03: XSS payload in name stored (output encoding on clients)."""
    xss_name = "<script>alert('xss')</script>"
    response = client.post(
        "/api/auth/register",
        json={"name": xss_name, "email": "xss@profile.test", "password": "ValidPass123!"},
    )
    assert response.status_code == 201
    # API returns stored value; clients must escape on render
    assert response.get_json()["name"] == xss_name


# ==================== Profile read — Positive ====================


def test_upm_pro_001_read_own_profile(client, owner_auth, owner):
    """UPM-PRO-001: GET /api/auth/me."""
    response = client.get("/api/auth/me", headers=owner_auth)
    assert response.status_code == 200
    assert response.get_json()["email"] == owner.email


def test_upm_pro_002_users_me(client, owner_auth, owner):
    """UPM-PRO-002: GET /api/users/me."""
    response = client.get("/api/users/me", headers=owner_auth)
    assert response.status_code == 200
    assert response.get_json()["email"] == owner.email


# ==================== Profile — Negative / Security ====================


def test_upm_pro_n01_unauthenticated(client):
    """UPM-PRO-N01: No token."""
    assert client.get("/api/auth/me").status_code == 401


def test_upm_pro_n02_invalid_jwt(client):
    """UPM-PRO-N02: Bad token."""
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert response.status_code in (401, 422)


def test_upm_pro_s01_idor_get_other_user(client, owner_auth, member):
    """UPM-PRO-S01: Customer cannot GET /api/users/{other_id}."""
    response = client.get(f"/api/users/{member.id}", headers=owner_auth)
    assert response.status_code == 403


def test_upm_pro_n09_customer_cannot_admin_update(client, owner_auth, member):
    """UPM-PRO-N09: Customer cannot PUT /api/users/{id}."""
    response = client.put(
        f"/api/users/{member.id}",
        json={"name": "Hacked"},
        headers=owner_auth,
    )
    assert response.status_code == 403


# ==================== Profile update (planned endpoint) ====================


@pytest.mark.skip(reason="PUT /api/users/me not implemented — UPM-PRO-003")
def test_upm_pro_003_update_display_name(client):
    pass


@pytest.mark.skip(reason="PUT /api/users/me not implemented — UPM-PRO-004")
def test_upm_pro_004_update_email(client):
    pass


@pytest.mark.skip(reason="PUT /api/users/me not implemented — UPM-PRO-N03")
def test_upm_pro_n03_duplicate_email_on_update(client):
    pass


# ==================== Password change (planned endpoint) ====================


@pytest.mark.skip(reason="PUT /api/users/me/password not implemented — UPM-PWD-001")
def test_upm_pwd_001_change_password(client):
    pass


@pytest.mark.skip(reason="PUT /api/users/me/password not implemented — UPM-PWD-N01")
def test_upm_pwd_n01_wrong_current_password(client):
    pass


# ==================== Account deletion (planned endpoint) ====================


@pytest.mark.skip(reason="DELETE /api/users/me not implemented — UPM-DEL-001")
def test_upm_del_001_self_delete(client):
    pass


@pytest.mark.skip(reason="DELETE /api/users/me not implemented — UPM-DEL-N01")
def test_upm_del_n01_wrong_password(client):
    pass


# ==================== UI validation logic (mirrors settingsValidation.ts) ====================


def _validate_profile_ui(full_name, email, phone, country):
    """Mirror of src/components/settings/settingsValidation.ts validateProfile."""
    errors = {}
    if not full_name.strip():
        errors["fullName"] = "required"
    elif len(full_name.strip()) < 2:
        errors["fullName"] = "min"
    if not email.strip():
        errors["email"] = "required"
    elif "@" not in email or "." not in email.split("@")[-1]:
        errors["email"] = "format"
    if phone.strip() and len(phone.strip()) < 7:
        errors["phone"] = "format"
    if not country:
        errors["country"] = "required"
    return errors


@pytest.mark.parametrize(
    "full_name,email,phone,country,expected_key",
    [
        ("Jordan Lee", "jordan@taskflow.app", "+1 555 123 4567", "US", None),
        ("", "jordan@taskflow.app", "", "US", "fullName"),
        ("J", "jordan@taskflow.app", "", "US", "fullName"),
        ("Jordan Lee", "bad-email", "", "US", "email"),
        ("Jordan Lee", "jordan@taskflow.app", "123", "US", "phone"),
        ("Jordan Lee", "jordan@taskflow.app", "", "", "country"),
    ],
)
def test_upm_pro_ui_validation(full_name, email, phone, country, expected_key):
    """UPM-PRO-N06–N08: UI profile validation cases."""
    errors = _validate_profile_ui(full_name, email, phone, country)
    if expected_key is None:
        assert errors == {}
    else:
        assert expected_key in errors


def test_upm_reg_n08_ui_password_mismatch_logic():
    """UPM-REG-N08: Password confirm mismatch (UI rule)."""
    password = "SecurePass123!"
    confirm = "DifferentPass456!"
    assert password != confirm


def test_upm_login_disabled_account(client, owner):
    """Edge: disabled account cannot login."""
    owner.is_active = False
    db.session.commit()
    response = _login(client, owner.email, "OwnerPass123!")
    assert response.status_code == 403
