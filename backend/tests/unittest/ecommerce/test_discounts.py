"""CHK-DSC-* — Discount code tests."""

import unittest
from decimal import Decimal

from tests.unittest.ecommerce.checkout_logic import apply_discount, cart_subtotal
from tests.unittest.ecommerce.fixtures import DISCOUNT_CODES


class DiscountPositiveTests(unittest.TestCase):
    def test_chk_dsc_001_save10_percent(self):
        subtotal = cart_subtotal([{"product_id": "wireless-headphones", "quantity": 1}])
        result = apply_discount("SAVE10", subtotal)
        self.assertEqual(result["code"], "SAVE10")
        self.assertEqual(result["discount_amount"], Decimal("15.00"))
        self.assertEqual(result["total"], Decimal("140.98"))  # 134.99 + 5.99 ship

    def test_chk_dsc_002_flat20_on_eligible_cart(self):
        subtotal = cart_subtotal([{"product_id": "wireless-headphones", "quantity": 1}])
        result = apply_discount("FLAT20", subtotal)
        self.assertEqual(result["discount_amount"], Decimal("20.00"))

    def test_chk_dsc_004_free_shipping(self):
        subtotal = cart_subtotal([{"product_id": "ceramic-mug-set", "quantity": 2}])
        result = apply_discount("FREESHIP", subtotal)
        self.assertEqual(result["shipping_fee"], Decimal("0.00"))


class DiscountNegativeTests(unittest.TestCase):
    def test_chk_dsc_n01_invalid_code(self):
        with self.assertRaises(LookupError):
            apply_discount("INVALID", Decimal("100.00"))

    def test_chk_dsc_n02_expired_code(self):
        with self.assertRaises(ValueError) as ctx:
            apply_discount("EXPIRED50", Decimal("100.00"))
        self.assertIn("expired", str(ctx.exception).lower())

    def test_chk_dsc_n03_below_minimum(self):
        subtotal = cart_subtotal([{"product_id": "ceramic-mug-set", "quantity": 1}])
        with self.assertRaises(ValueError) as ctx:
            apply_discount("SAVE10", subtotal)
        self.assertIn("minimum", str(ctx.exception).lower())

    def test_chk_dsc_n04_empty_code(self):
        with self.assertRaises(ValueError):
            apply_discount("", Decimal("50.00"))

    def test_chk_dsc_n06_maxed_usage(self):
        with self.assertRaises(ValueError) as ctx:
            apply_discount("MAXED", Decimal("50.00"))
        self.assertIn("limit", str(ctx.exception).lower())


class DiscountEdgeTests(unittest.TestCase):
    def test_chk_dsc_e01_discount_capped_at_subtotal(self):
        from decimal import Decimal

        from tests.unittest.ecommerce.checkout_logic import apply_discount

        result = apply_discount("FLAT20", Decimal("150.00"))
        self.assertLessEqual(result["discount_amount"], Decimal("150.00"))

    def test_chk_dsc_e02_case_insensitive(self):
        subtotal = cart_subtotal([{"product_id": "wireless-headphones", "quantity": 1}])
        lower = apply_discount("save10", subtotal)
        upper = apply_discount("SAVE10", subtotal)
        self.assertEqual(lower["discount_amount"], upper["discount_amount"])


class DiscountApiTests(unittest.TestCase):
    @unittest.skip("POST /api/cart/discount not implemented")
    def test_chk_dsc_api_apply(self):
        pass


if __name__ == "__main__":
    unittest.main()
