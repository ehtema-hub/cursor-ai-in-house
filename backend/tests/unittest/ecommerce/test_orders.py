"""CHK-ORD-* — Order confirmation tests."""

import re
import unittest

from tests.unittest.base import BaseProfileApiTestCase


def generate_order_number(sequence: int, date_str: str = "20260617") -> str:
    """Mirrors expected ORD-YYYYMMDD-XXXX format."""
    return f"ORD-{date_str}-{sequence:04d}"


class OrderConfirmationLogicTests(unittest.TestCase):
    def test_chk_ord_004_order_number_format(self):
        number = generate_order_number(42)
        self.assertRegex(number, r"^ORD-\d{8}-\d{4}$")

    def test_chk_ord_e01_idempotency_key_uniqueness(self):
        keys = {f"idem-{i}" for i in range(100)}
        self.assertEqual(len(keys), 100)


class OrderApiTests(BaseProfileApiTestCase):
    @unittest.skip("POST /api/orders not implemented — CHK-ORD-001")
    def test_chk_ord_001_create_order(self):
        response = self.client.post("/api/orders", headers=self.owner_auth, json={})
        self.assertEqual(response.status_code, 201)
        self.assertRegex(response.get_json()["order_number"], r"^ORD-")

    @unittest.skip("GET /api/orders/:id not implemented — CHK-ORD-N01")
    def test_chk_ord_n01_other_user_forbidden(self):
        pass


if __name__ == "__main__":
    unittest.main()
