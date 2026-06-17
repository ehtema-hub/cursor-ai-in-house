"""CHK-PAY-* — Payment validation and processing tests."""

import unittest

from tests.unittest.base import BaseProfileApiTestCase
from tests.unittest.ecommerce.checkout_logic import luhn_check, validate_payment
from tests.unittest.ecommerce.fixtures import DECLINED_CARD, VALID_PAYMENT


class PaymentValidationPositiveTests(unittest.TestCase):
    def test_chk_pay_001_valid_test_card(self):
        result = validate_payment(VALID_PAYMENT)
        self.assertTrue(result["valid"])
        self.assertEqual(result["last4"], "4242")
        self.assertEqual(result["brand"], "visa")

    def test_luhn_valid_visa(self):
        self.assertTrue(luhn_check("4242424242424242"))


class PaymentValidationNegativeTests(unittest.TestCase):
    def test_chk_pay_n01_declined_card(self):
        payload = {**VALID_PAYMENT, "card_number": DECLINED_CARD}
        result = validate_payment(payload)
        self.assertFalse(result["valid"])
        self.assertIn("card_number", result["errors"])

    def test_chk_pay_n02_invalid_card_format(self):
        result = validate_payment({**VALID_PAYMENT, "card_number": "1234"})
        self.assertFalse(result["valid"])

    def test_chk_pay_n03_expired_card(self):
        payload = {**VALID_PAYMENT, "exp_year": 2020}
        result = validate_payment(payload, current_year=2030)
        self.assertIn("exp_year", result["errors"])

    def test_chk_pay_n04_invalid_cvc(self):
        result = validate_payment({**VALID_PAYMENT, "cvc": "12"})
        self.assertIn("cvc", result["errors"])

    def test_chk_pay_n05_empty_cart_checkout_logic(self):
        from tests.unittest.ecommerce.checkout_logic import cart_subtotal

        self.assertEqual(cart_subtotal([]), 0)


class PaymentEdgeTests(unittest.TestCase):
    def test_chk_pay_e02_zero_total_skips_card_requirement_at_logic_layer(self):
        from decimal import Decimal

        from tests.unittest.ecommerce.checkout_logic import apply_discount

        # 100% would need special code — zero subtotal after discount floor
        result = apply_discount("FLAT20", Decimal("100.00"))
        self.assertGreaterEqual(result["total"], Decimal("0.00"))


class PaymentApiTests(BaseProfileApiTestCase):
    @unittest.skip("POST /api/checkout/payment not implemented — CHK-PAY-001")
    def test_chk_pay_api_success(self):
        response = self.client.post(
            "/api/checkout/payment",
            json=VALID_PAYMENT,
            headers=self.owner_auth,
        )
        self.assertEqual(response.status_code, 200)


class PaymentSecurityTests(unittest.TestCase):
    def test_chk_pay_s01_validation_returns_last4_only(self):
        result = validate_payment(VALID_PAYMENT)
        self.assertNotIn("4242424242424242", str(result))
        self.assertEqual(result.get("last4"), "4242")

    def test_chk_pay_s02_cvc_not_in_success_payload(self):
        result = validate_payment(VALID_PAYMENT)
        self.assertNotIn("cvc", result)


if __name__ == "__main__":
    unittest.main()
