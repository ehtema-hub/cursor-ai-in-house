"""CHK-*-S* — Checkout security tests (SQLi, XSS, tampering)."""

import unittest

from tests.unittest.ecommerce.checkout_logic import (
    apply_discount,
    is_sql_injection_safe,
    sanitize_display_text,
)
from tests.unittest.ecommerce.fixtures import SQL_INJECTION, XSS_PAYLOAD


class CheckoutSecurityTests(unittest.TestCase):
    def test_chk_dsc_s01_sql_injection_in_code_rejected(self):
        self.assertFalse(is_sql_injection_safe(SQL_INJECTION))
        with self.assertRaises(LookupError):
            apply_discount(SQL_INJECTION, 100)

    def test_chk_cart_s01_sql_injection_product_id_unsafe_pattern(self):
        self.assertFalse(is_sql_injection_safe("'; DROP TABLE cart;--"))

    def test_chk_pay_s03_xss_billing_name_sanitized(self):
        cleaned = sanitize_display_text(XSS_PAYLOAD)
        self.assertNotIn("<script>", cleaned)

    def test_chk_cart_s02_client_price_tampering_server_catalog(self):
        """Server must use catalog price, not client-supplied price."""
        from tests.unittest.ecommerce.checkout_logic import cart_subtotal
        from tests.unittest.ecommerce.fixtures import PRODUCTS

        subtotal = cart_subtotal([{"product_id": "wireless-headphones", "quantity": 1}])
        self.assertEqual(subtotal, PRODUCTS["wireless-headphones"]["price"])
        # Client sending price=0.01 in JSON should be ignored when API exists


if __name__ == "__main__":
    unittest.main()
