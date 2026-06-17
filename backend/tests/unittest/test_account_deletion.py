"""UPM-DEL-* — Account deletion tests (positive, negative, edge, security)."""

import unittest

from app.models.user import User
from tests.unittest.base import BaseProfileApiTestCase
from tests.unittest.fixtures import USER_A


class AccountDeletionPositiveTests(BaseProfileApiTestCase):
    """UPM-DEL-001 through UPM-DEL-003."""

    @unittest.skip("DELETE /api/users/me not implemented — UPM-DEL-001")
    def test_upm_del_001_self_delete_account(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        response = self.client.delete(
            "/api/users/me",
            json={"password": USER_A["password"], "confirm_deletion": True},
            headers=headers,
        )
        self.assertEqual(response.status_code, 204)
        user = User.query.filter_by(email=USER_A["email"]).first()
        self.assertTrue(user is None or user.is_active is False)

    @unittest.skip("DELETE /api/users/me not implemented — UPM-DEL-002")
    def test_upm_del_002_login_after_deletion(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        self.client.delete(
            "/api/users/me",
            json={"password": USER_A["password"], "confirm_deletion": True},
            headers=headers,
        )
        login = self.login(USER_A["email"], USER_A["password"])
        self.assertIn(login.status_code, (401, 403))


class AccountDeletionNegativeTests(BaseProfileApiTestCase):
    """UPM-DEL-N01 through UPM-DEL-N04."""

    @unittest.skip("DELETE /api/users/me not implemented — UPM-DEL-N01")
    def test_upm_del_n01_wrong_password_confirmation(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        response = self.client.delete(
            "/api/users/me",
            json={"password": "WrongPass123!", "confirm_deletion": True},
            headers=headers,
        )
        self.assertIn(response.status_code, (400, 401))

    @unittest.skip("DELETE /api/users/me not implemented — UPM-DEL-N04")
    def test_upm_del_n04_unauthenticated_delete(self):
        response = self.client.delete("/api/users/me")
        self.assertEqual(response.status_code, 401)

    def test_upm_del_n03_cannot_delete_another_user_via_admin_route_as_customer(self):
        response = self.client.delete(
            f"/api/users/{self.member.id}",
            headers=self.owner_auth,
        )
        self.assertIn(response.status_code, (403, 404, 405))


class AccountDeletionEdgeCaseTests(BaseProfileApiTestCase):
    """UPM-DEL-E03."""

    @unittest.skip("DELETE /api/users/me not implemented — UPM-DEL-E03")
    def test_upm_del_e03_double_delete_returns_not_found(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        payload = {"password": USER_A["password"], "confirm_deletion": True}
        self.client.delete("/api/users/me", json=payload, headers=headers)
        second = self.client.delete("/api/users/me", json=payload, headers=headers)
        self.assertIn(second.status_code, (401, 404))


class AccountDeletionSecurityTests(BaseProfileApiTestCase):
    """UPM-DEL-S01."""

    @unittest.skip("DELETE /api/users/me not implemented — UPM-DEL-S01")
    def test_upm_del_s01_requires_jwt(self):
        response = self.client.delete(
            "/api/users/me",
            json={"password": "any", "confirm_deletion": True},
        )
        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
