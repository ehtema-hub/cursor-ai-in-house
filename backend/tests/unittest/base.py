"""Base TestCase with Flask app setup/teardown and API helpers."""

from __future__ import annotations

import unittest

from app.extensions import db
from app.models.user import User
from app.services.cache import cache


class BaseProfileApiTestCase(unittest.TestCase):
    """Creates an isolated in-memory DB and test client per test method."""

    @classmethod
    def setUpClass(cls) -> None:
        from app import create_app

        cls.app = create_app("testing")
        cls.app_context = cls.app.app_context()
        cls.app_context.push()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.app_context.pop()

    def setUp(self) -> None:
        cache._memory.clear()
        cache._redis = None
        db.create_all()
        self.client = self.app.test_client()
        self._create_seed_users()

    def tearDown(self) -> None:
        db.session.remove()
        db.drop_all()
        cache._memory.clear()

    def _create_seed_users(self) -> None:
        self.owner = User(name="Project Owner", email="owner@test.local", role="customer")
        self.owner.set_password("OwnerPass123!")
        self.member = User(name="Team Member", email="member@test.local", role="customer")
        self.member.set_password("MemberPass123!")
        db.session.add_all([self.owner, self.member])
        db.session.commit()

    def register(self, payload: dict):
        return self.client.post("/api/auth/register", json=payload)

    def login(self, email: str, password: str):
        return self.client.post("/api/auth/login", json={"email": email, "password": password})

    def auth_headers(self, email: str, password: str) -> dict[str, str]:
        response = self.login(email, password)
        self.assertEqual(response.status_code, 200)
        token = response.get_json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    @property
    def owner_auth(self) -> dict[str, str]:
        return self.auth_headers(self.owner.email, "OwnerPass123!")

    @property
    def member_auth(self) -> dict[str, str]:
        return self.auth_headers(self.member.email, "MemberPass123!")


def validate_profile_ui(full_name: str, email: str, phone: str, country: str) -> dict:
    """Mirror of frontend settingsValidation.validateProfile."""
    errors: dict[str, str] = {}
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
