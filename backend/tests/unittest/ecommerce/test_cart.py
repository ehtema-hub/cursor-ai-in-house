"""CHK-CART-* — Cart management tests."""

import unittest

from decimal import Decimal

from tests.unittest.base import BaseProfileApiTestCase
from tests.unittest.ecommerce.checkout_logic import cart_subtotal, money
from tests.unittest.ecommerce.fixtures import MAX_CART_QUANTITY, PRODUCTS


class CartLogicPositiveTests(unittest.TestCase):
    """CHK-CART-001 through CHK-CART-006 (business logic)."""

    def test_chk_cart_001_single_item_subtotal(self):
        subtotal = cart_subtotal([{"product_id": "wireless-headphones", "quantity": 1}])
        self.assertEqual(subtotal, PRODUCTS["wireless-headphones"]["price"])

    def test_chk_cart_003_multiple_products(self):
        items = [
            {"product_id": "ceramic-mug-set", "quantity": 2},
            {"product_id": "wireless-headphones", "quantity": 1},
        ]
        expected = money(PRODUCTS["ceramic-mug-set"]["price"] * 2 + PRODUCTS["wireless-headphones"]["price"])
        self.assertEqual(cart_subtotal(items), expected)

    def test_chk_cart_005_quantity_update_recalc(self):
        one = cart_subtotal([{"product_id": "ceramic-mug-set", "quantity": 1}])
        two = cart_subtotal([{"product_id": "ceramic-mug-set", "quantity": 2}])
        self.assertEqual(two, money(one * 2))


class CartLogicNegativeTests(unittest.TestCase):
    """CHK-CART-N01 through CHK-CART-N04."""

    def test_chk_cart_n01_out_of_stock(self):
        with self.assertRaises(ValueError) as ctx:
            cart_subtotal([{"product_id": "out-of-stock-item", "quantity": 1}])
        self.assertIn("stock", str(ctx.exception).lower())

    def test_chk_cart_n02_invalid_product(self):
        with self.assertRaises(ValueError):
            cart_subtotal([{"product_id": "nonexistent", "quantity": 1}])

    def test_chk_cart_n03_zero_quantity(self):
        with self.assertRaises(ValueError):
            cart_subtotal([{"product_id": "ceramic-mug-set", "quantity": 0}])

    def test_chk_cart_n04_exceeds_max_quantity(self):
        with self.assertRaises(ValueError):
            cart_subtotal([{"product_id": "ceramic-mug-set", "quantity": MAX_CART_QUANTITY + 1}])


class CartLogicEdgeTests(unittest.TestCase):
    """CHK-CART-E01 through CHK-CART-E03."""

    def test_chk_cart_e01_empty_cart_subtotal(self):
        self.assertEqual(cart_subtotal([]), Decimal("0.00"))

    def test_chk_cart_e02_max_quantity_boundary(self):
        subtotal = cart_subtotal([{"product_id": "ceramic-mug-set", "quantity": MAX_CART_QUANTITY}])
        self.assertEqual(subtotal, money(PRODUCTS["ceramic-mug-set"]["price"] * MAX_CART_QUANTITY))


class CartApiTests(BaseProfileApiTestCase):
    """HTTP cart endpoints (skipped until implemented)."""

    @unittest.skip("POST /api/cart/items not implemented — CHK-CART-001")
    def test_chk_cart_api_add_item(self):
        headers = self.owner_auth
        response = self.client.post(
            "/api/cart/items",
            json={"product_id": "wireless-headphones", "quantity": 1},
            headers=headers,
        )
        self.assertEqual(response.status_code, 201)


if __name__ == "__main__":
    unittest.main()
