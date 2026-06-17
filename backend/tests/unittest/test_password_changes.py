"""UPM-PWD-* — Password change tests (positive, negative, edge, security)."""

import unittest

from tests.unittest.base import BaseProfileApiTestCase
from tests.unittest.fixtures import USER_A


class PasswordChangePositiveTests(BaseProfileApiTestCase):
    """UPM-PWD-001 through UPM-PWD-003."""

    @unittest.skip("PUT /api/users/me/password not implemented — UPM-PWD-001")
    def test_upm_pwd_001_change_password_success(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        response = self.client.put(
            "/api/users/me/password",
            json={
                "current_password": USER_A["password"],
                "new_password": "NewSecurePass789!",
            },
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)
        login = self.login(USER_A["email"], "NewSecurePass789!")
        self.assertEqual(login.status_code, 200)

    @unittest.skip("PUT /api/users/me/password not implemented — UPM-PWD-002")
    def test_upm_pwd_002_old_password_rejected_after_change(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        self.client.put(
            "/api/users/me/password",
            json={
                "current_password": USER_A["password"],
                "new_password": "NewSecurePass789!",
            },
            headers=headers,
        )
        login = self.login(USER_A["email"], USER_A["password"])
        self.assertEqual(login.status_code, 401)


class PasswordChangeNegativeTests(BaseProfileApiTestCase):
    """UPM-PWD-N01 through UPM-PWD-N05."""

    @unittest.skip("PUT /api/users/me/password not implemented — UPM-PWD-N01")
    def test_upm_pwd_n01_wrong_current_password(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        response = self.client.put(
            "/api/users/me/password",
            json={
                "current_password": "WrongPass123!",
                "new_password": "NewSecurePass789!",
            },
            headers=headers,
        )
        self.assertIn(response.status_code, (400, 401))

    @unittest.skip("PUT /api/users/me/password not implemented — UPM-PWD-N02")
    def test_upm_pwd_n02_new_password_too_short(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        response = self.client.put(
            "/api/users/me/password",
            json={"current_password": USER_A["password"], "new_password": "short"},
            headers=headers,
        )
        self.assertEqual(response.status_code, 422)

    @unittest.skip("PUT /api/users/me/password not implemented — UPM-PWD-N04")
    def test_upm_pwd_n04_unauthenticated(self):
        response = self.client.put(
            "/api/users/me/password",
            json={"current_password": "x", "new_password": "NewSecurePass789!"},
        )
        self.assertEqual(response.status_code, 401)


class PasswordChangeEdgeCaseTests(BaseProfileApiTestCase):
    """UPM-PWD-E01 through UPM-PWD-E03."""

    @unittest.skip("PUT /api/users/me/password not implemented — UPM-PWD-E01")
    def test_upm_pwd_e01_minimum_length_new_password(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        response = self.client.put(
            "/api/users/me/password",
            json={"current_password": USER_A["password"], "new_password": "12345678"},
            headers=headers,
        )
        self.assertEqual(response.status_code, 200)


class PasswordChangeSecurityTests(BaseProfileApiTestCase):
    """UPM-PWD-S01 through UPM-PWD-S02."""

    @unittest.skip("PUT /api/users/me/password not implemented — UPM-PWD-S02")
    def test_upm_pwd_s02_password_not_in_response(self):
        self.register(USER_A)
        headers = self.auth_headers(USER_A["email"], USER_A["password"])
        response = self.client.put(
            "/api/users/me/password",
            json={
                "current_password": USER_A["password"],
                "new_password": "NewSecurePass789!",
            },
            headers=headers,
        )
        body = response.get_json() or {}
        self.assertNotIn("password", body)
        self.assertNotIn("new_password", body)


if __name__ == "__main__":
    unittest.main()
