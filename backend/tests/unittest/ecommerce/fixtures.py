"""Mock catalog, discounts, and payment data for checkout tests."""

from decimal import Decimal

PRODUCTS = {
    "wireless-headphones": {
        "id": "wireless-headphones",
        "name": "Aura Wireless Headphones",
        "price": Decimal("149.99"),
        "in_stock": True,
    },
    "ceramic-mug-set": {
        "id": "ceramic-mug-set",
        "name": "Stoneware Mug Set (4-Pack)",
        "price": Decimal("33.00"),
        "in_stock": True,
    },
    "smart-watch": {
        "id": "smart-watch",
        "name": "Pulse Smart Watch Series 5",
        "price": Decimal("299.00"),
        "in_stock": True,
    },
    "out-of-stock-item": {
        "id": "out-of-stock-item",
        "name": "Discontinued Widget",
        "price": Decimal("9.99"),
        "in_stock": False,
    },
}

DISCOUNT_CODES = {
    "SAVE10": {
        "code": "SAVE10",
        "type": "percent",
        "value": Decimal("10"),
        "min_subtotal": Decimal("50.00"),
        "active": True,
        "max_uses_remaining": None,
    },
    "FLAT20": {
        "code": "FLAT20",
        "type": "fixed",
        "value": Decimal("20.00"),
        "min_subtotal": Decimal("100.00"),
        "active": True,
        "max_uses_remaining": None,
    },
    "FREESHIP": {
        "code": "FREESHIP",
        "type": "shipping",
        "value": Decimal("0"),
        "min_subtotal": Decimal("25.00"),
        "active": True,
        "max_uses_remaining": None,
    },
    "EXPIRED50": {
        "code": "EXPIRED50",
        "type": "percent",
        "value": Decimal("50"),
        "min_subtotal": Decimal("0"),
        "active": False,
        "max_uses_remaining": None,
    },
    "MAXED": {
        "code": "MAXED",
        "type": "fixed",
        "value": Decimal("5.00"),
        "min_subtotal": Decimal("0"),
        "active": True,
        "max_uses_remaining": 0,
    },
}

VALID_PAYMENT = {
    "card_number": "4242424242424242",
    "exp_month": 12,
    "exp_year": 2030,
    "cvc": "123",
    "billing_email": "buyer@checkout.test",
    "billing_name": "Jordan Lee",
}

DECLINED_CARD = "4111111111111112"
SQL_INJECTION = "'; DROP TABLE orders;--"
XSS_PAYLOAD = "<script>alert('xss')</script>"

BUYER = {
    "name": "Checkout Buyer",
    "email": "buyer@checkout.test",
    "password": "CheckoutPass123!",
}

MAX_CART_QUANTITY = 99
