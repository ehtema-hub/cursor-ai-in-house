"""UPM-PRO-* — Profile read/update tests (positive, negative, edge, security)."""

import unittest

from tests.unittest.base import BaseProfileApiTestCase, validate_profile_ui
from tests.unittest.fixtures import UI_VALIDATION_CASES, UI_VALID_PROFILE


class ProfileReadPositiveTests(BaseProfileApiTestCase):
    """UPM-PRO-001, UPM-PRO-002."""

    def test_upm_pro_001_read_own_profile_auth_me(self):
        response = self.client.get("/api/auth/me", headers=self.owner_auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["email"], self.owner.email)

    def test_upm_pro_002_read_own_profile_users_me(self):
        response = self.client.get("/api/users/me", headers=self.owner_auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["email"], self.owner.email)


class ProfileUpdatePositiveTests(BaseProfileApiTestCase):
    """UPM-PRO-003 through UPM-PRO-006 (planned self-service endpoint)."""

    @unittest.skip("PUT /api/users/me not implemented — UPM-PRO-003")
    def test_upm_pro_003_update_display_name(self):
        response = self.client.put(
            "/api/users/me",
            json={"name": "New Display Name"},
            headers=self.owner_auth,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["name"], "New Display Name")

    @unittest.skip("PUT /api/users/me not implemented — UPM-PRO-004")
    def test_upm_pro_004_update_email(self):
        response = self.client.put(
            "/api/users/me",
            json={"email": "newemail@profile.test"},
            headers=self.owner_auth,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["email"], "newemail@profile.test")

    def test_upm_pro_005_ui_valid_profile_passes_validation(self):
        errors = validate_profile_ui(
            UI_VALID_PROFILE["fullName"],
            UI_VALID_PROFILE["email"],
            UI_VALID_PROFILE["phone"],
            UI_VALID_PROFILE["country"],
        )
        self.assertEqual(errors, {})


class ProfileUpdateNegativeTests(BaseProfileApiTestCase):
    """UPM-PRO-N01 through UPM-PRO-N09."""

    def test_upm_pro_n01_unauthenticated_read(self):
        response = self.client.get("/api/auth/me")
        self.assertEqual(response.status_code, 401)

    def test_upm_pro_n02_invalid_jwt(self):
        response = self.client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )
        self.assertIn(response.status_code, (401, 422))

    @unittest.skip("PUT /api/users/me not implemented — UPM-PRO-N03")
    def test_upm_pro_n03_duplicate_email_on_update(self):
        self.register(
            {"name": "Other", "email": "taken@profile.test", "password": "ValidPass123!"}
        )
        response = self.client.put(
            "/api/users/me",
            json={"email": "taken@profile.test"},
            headers=self.owner_auth,
        )
        self.assertEqual(response.status_code, 409)

    def test_upm_pro_n06_ui_missing_full_name(self):
        errors = validate_profile_ui("", UI_VALID_PROFILE["email"], "", "US")
        self.assertIn("fullName", errors)

    def test_upm_pro_n07_ui_invalid_phone(self):
        errors = validate_profile_ui(
            UI_VALID_PROFILE["fullName"],
            UI_VALID_PROFILE["email"],
            "123",
            "US",
        )
        self.assertIn("phone", errors)

    def test_upm_pro_n08_ui_missing_country(self):
        errors = validate_profile_ui(
            UI_VALID_PROFILE["fullName"],
            UI_VALID_PROFILE["email"],
            "",
            "",
        )
        self.assertIn("country", errors)

    def test_upm_pro_n09_customer_cannot_admin_update_other_user(self):
        response = self.client.put(
            f"/api/users/{self.member.id}",
            json={"name": "Hacked"},
            headers=self.owner_auth,
        )
        self.assertEqual(response.status_code, 403)


class ProfileUpdateEdgeCaseTests(BaseProfileApiTestCase):
    """UPM-PRO-E01 through UPM-PRO-E02."""

    def test_upm_pro_e02_whitespace_only_name_rejected_by_ui(self):
        errors = validate_profile_ui("   ", UI_VALID_PROFILE["email"], "", "US")
        self.assertIn("fullName", errors)

    @unittest.skip("PUT /api/users/me not implemented — UPM-PRO-E01")
    def test_upm_pro_e01_noop_update_same_values(self):
        response = self.client.put(
            "/api/users/me",
            json={"name": self.owner.name},
            headers=self.owner_auth,
        )
        self.assertEqual(response.status_code, 200)


class ProfileSecurityTests(BaseProfileApiTestCase):
    """UPM-PRO-S01 through UPM-PRO-S04."""

    def test_upm_pro_s01_idor_cannot_read_other_user(self):
        response = self.client.get(f"/api/users/{self.member.id}", headers=self.owner_auth)
        self.assertEqual(response.status_code, 403)

    def test_upm_pro_s01_owner_can_read_own_user_detail(self):
        response = self.client.get(f"/api/users/{self.owner.id}", headers=self.owner_auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["email"], self.owner.email)

    @unittest.skip("PUT /api/users/me not implemented — UPM-PRO-S02")
    def test_upm_pro_s02_cannot_escalate_role_via_self_update(self):
        response = self.client.put(
            "/api/users/me",
            json={"role": "admin"},
            headers=self.owner_auth,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["role"], "customer")


class ProfileUiValidationTests(unittest.TestCase):
    """Parametrized UI validation cases from spec (UPM-PRO-N06–N08)."""

    def test_upm_pro_ui_validation_matrix(self):
        for full_name, email, phone, country, expected_key in UI_VALIDATION_CASES:
            with self.subTest(full_name=full_name, email=email):
                errors = validate_profile_ui(full_name, email, phone, country)
                if expected_key is None:
                    self.assertEqual(errors, {})
                else:
                    self.assertIn(expected_key, errors)


if __name__ == "__main__":
    unittest.main()
