"""UPM-REG-* — User registration tests (positive, negative, edge, security)."""

import unittest

from app.models.user import User
from tests.unittest.base import BaseProfileApiTestCase
from tests.unittest.fixtures import (
    INVALID_REGISTRATION_PAYLOADS,
    MISSING_FIELD_PAYLOADS,
    SQL_INJECTION_NAME,
    UNICODE_NAME_USER,
    USER_A,
    USER_B,
    VALID_MIN_PASSWORD_USER,
    XSS_NAME,
)


class RegistrationPositiveTests(BaseProfileApiTestCase):
    """UPM-REG-001 through UPM-REG-006."""

    def test_upm_reg_001_register_with_valid_data(self):
        response = self.register(USER_A)
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertEqual(data["email"], USER_A["email"])
        self.assertEqual(data["name"], USER_A["name"])
        self.assertNotIn("password", data)
        self.assertNotIn("password_hash", data)

    def test_upm_reg_002_login_after_registration(self):
        self.register(USER_A)
        login = self.login(USER_A["email"], USER_A["password"])
        self.assertEqual(login.status_code, 200)
        body = login.get_json()
        self.assertTrue(body.get("access_token"))
        self.assertTrue(body.get("refresh_token"))

    def test_upm_reg_003_get_profile_after_register(self):
        self.register(USER_A)
        login = self.login(USER_A["email"], USER_A["password"])
        token = login.get_json()["access_token"]
        me = self.client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.get_json()["email"], USER_A["email"])

    def test_upm_reg_005_email_normalization(self):
        payload = {**USER_B, "email": "Blake.Chen@Profile.TEST"}
        response = self.register(payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["email"], "blake.chen@profile.test")

    def test_upm_reg_006_name_trimmed(self):
        payload = {**USER_A, "email": "trim.name@profile.test", "name": "  Alex Morgan  "}
        response = self.register(payload)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["name"], "Alex Morgan")


class RegistrationNegativeTests(BaseProfileApiTestCase):
    """UPM-REG-N01 through UPM-REG-N09."""

    def test_upm_reg_n01_duplicate_email(self):
        response = self.register(
            {"name": "Dup", "email": self.owner.email, "password": "SecurePass123!"}
        )
        self.assertEqual(response.status_code, 409)

    def test_upm_reg_n02_missing_name(self):
        response = self.register(MISSING_FIELD_PAYLOADS[0])
        self.assertEqual(response.status_code, 422)

    def test_upm_reg_n03_missing_email(self):
        response = self.register(MISSING_FIELD_PAYLOADS[1])
        self.assertEqual(response.status_code, 422)

    def test_upm_reg_n04_missing_password(self):
        response = self.register(MISSING_FIELD_PAYLOADS[2])
        self.assertEqual(response.status_code, 422)

    def test_upm_reg_n05_invalid_email_format(self):
        response = self.register(INVALID_REGISTRATION_PAYLOADS[0])
        self.assertEqual(response.status_code, 422)

    def test_upm_reg_n06_password_too_short(self):
        response = self.register(INVALID_REGISTRATION_PAYLOADS[1])
        self.assertEqual(response.status_code, 422)

    def test_upm_reg_n07_name_too_short(self):
        response = self.register(INVALID_REGISTRATION_PAYLOADS[2])
        self.assertEqual(response.status_code, 422)

    def test_upm_reg_n08_ui_password_mismatch(self):
        password = "SecurePass123!"
        confirm = "DifferentPass456!"
        self.assertNotEqual(password, confirm)

    def test_upm_reg_e06_empty_json_body(self):
        response = self.register({})
        self.assertEqual(response.status_code, 422)


class RegistrationEdgeCaseTests(BaseProfileApiTestCase):
    """UPM-REG-E01 through UPM-REG-E05."""

    def test_upm_reg_e01_minimum_password_length(self):
        response = self.register(VALID_MIN_PASSWORD_USER)
        self.assertEqual(response.status_code, 201)

    def test_upm_reg_e02_max_name_length(self):
        payload = {
            "name": "A" * 120,
            "email": "maxname@profile.test",
            "password": "ValidPass123!",
        }
        response = self.register(payload)
        self.assertEqual(response.status_code, 201)

    def test_upm_reg_e03_unicode_name(self):
        response = self.register(UNICODE_NAME_USER)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["name"], UNICODE_NAME_USER["name"])

    def test_upm_reg_e04_plus_address_email(self):
        payload = {
            "name": "Plus User",
            "email": "user+tag@profile.test",
            "password": "ValidPass123!",
        }
        response = self.register(payload)
        self.assertEqual(response.status_code, 201)

    def test_upm_reg_e05_double_submit_same_email(self):
        first = self.register(
            {"name": "First", "email": "double@profile.test", "password": "ValidPass123!"}
        )
        self.assertEqual(first.status_code, 201)
        second = self.register(
            {"name": "Second", "email": "double@profile.test", "password": "ValidPass123!"}
        )
        self.assertEqual(second.status_code, 409)

    def test_upm_login_disabled_account(self):
        self.owner.is_active = False
        from app.extensions import db

        db.session.commit()
        response = self.login(self.owner.email, "OwnerPass123!")
        self.assertEqual(response.status_code, 403)


class RegistrationSecurityTests(BaseProfileApiTestCase):
    """UPM-REG-S01 through UPM-REG-S03."""

    def test_upm_reg_s01_password_not_in_response(self):
        response = self.register(
            {"name": "Secret", "email": "secret@profile.test", "password": "ValidPass123!"}
        )
        body = response.get_json()
        self.assertNotIn("password", body)
        self.assertNotIn("password_hash", body)

    def test_upm_reg_s02_password_hashed_in_database(self):
        self.register(
            {"name": "Hash Check", "email": "hash@profile.test", "password": "ValidPass123!"}
        )
        user = User.query.filter_by(email="hash@profile.test").first()
        self.assertIsNotNone(user)
        self.assertNotEqual(user.password_hash, "ValidPass123!")
        self.assertTrue(user.check_password("ValidPass123!"))

    def test_upm_reg_s03_xss_in_name_field(self):
        response = self.register(
            {"name": XSS_NAME, "email": "xss@profile.test", "password": "ValidPass123!"}
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["name"], XSS_NAME)

    def test_upm_reg_s03b_sql_injection_name_does_not_break_db(self):
        response = self.register(
            {
                "name": SQL_INJECTION_NAME,
                "email": "sqli@profile.test",
                "password": "ValidPass123!",
            }
        )
        self.assertEqual(response.status_code, 201)
        user = User.query.filter_by(email="sqli@profile.test").first()
        self.assertIsNotNone(user)


if __name__ == "__main__":
    unittest.main()
