"""Checkout business logic used by unittest (mirrors future server-side rules)."""

from __future__ import annotations

import re
from decimal import Decimal, ROUND_HALF_UP

from tests.unittest.ecommerce.fixtures import DISCOUNT_CODES, MAX_CART_QUANTITY, PRODUCTS


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def cart_subtotal(items: list[dict]) -> Decimal:
    """items: [{product_id, quantity}]"""
    total = Decimal("0")
    for line in items:
        product = PRODUCTS.get(line["product_id"])
        if product is None:
            raise ValueError(f"Unknown product: {line['product_id']}")
        qty = line["quantity"]
        if qty <= 0:
            raise ValueError("Quantity must be positive")
        if qty > MAX_CART_QUANTITY:
            raise ValueError("Quantity exceeds maximum")
        if not product["in_stock"]:
            raise ValueError("Product out of stock")
        total += product["price"] * qty
    return money(total)


def apply_discount(code: str, subtotal: Decimal, shipping: Decimal = Decimal("5.99")) -> dict:
    key = (code or "").strip().upper()
    if not key:
        raise ValueError("Discount code is required")

    record = DISCOUNT_CODES.get(key)
    if record is None:
        raise LookupError("Invalid discount code")
    if not record["active"]:
        raise ValueError("Discount code expired")
    if record["max_uses_remaining"] is not None and record["max_uses_remaining"] <= 0:
        raise ValueError("Discount usage limit reached")
    if subtotal < record["min_subtotal"]:
        raise ValueError("Minimum order value not met")

    discount_amount = Decimal("0")
    shipping_fee = shipping

    if record["type"] == "percent":
        discount_amount = money(subtotal * record["value"] / Decimal("100"))
    elif record["type"] == "fixed":
        discount_amount = money(min(record["value"], subtotal))
    elif record["type"] == "shipping":
        shipping_fee = Decimal("0.00")

    discount_amount = min(discount_amount, subtotal)
    total = money(max(subtotal - discount_amount, Decimal("0")) + shipping_fee)

    return {
        "code": key,
        "discount_amount": discount_amount,
        "shipping_fee": shipping_fee,
        "total": total,
    }


def luhn_check(card_number: str) -> bool:
    digits = re.sub(r"\D", "", card_number)
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    reverse = digits[::-1]
    for i, ch in enumerate(reverse):
        n = int(ch)
        if i % 2 == 1:
            n *= 2
            if n > 9:
                n -= 9
        checksum += n
    return checksum % 10 == 0


def validate_payment(payload: dict, *, current_year: int = 2030) -> dict:
    errors: dict[str, str] = {}
    card = (payload.get("card_number") or "").replace(" ", "")

    if not luhn_check(card):
        errors["card_number"] = "Invalid card number"
    if card == "4111111111111112":
        errors["card_number"] = "Card declined"

    exp_month = payload.get("exp_month")
    exp_year = payload.get("exp_year")
    if not isinstance(exp_month, int) or exp_month < 1 or exp_month > 12:
        errors["exp_month"] = "Invalid expiry month"
    if not isinstance(exp_year, int) or exp_year < current_year:
        errors["exp_year"] = "Card expired"

    cvc = str(payload.get("cvc") or "")
    if not re.fullmatch(r"\d{3,4}", cvc):
        errors["cvc"] = "Invalid CVC"

    email = (payload.get("billing_email") or "").strip()
    if not email or "@" not in email:
        errors["billing_email"] = "Invalid email"

    name = (payload.get("billing_name") or "").strip()
    if not name:
        errors["billing_name"] = "Billing name required"

    if errors:
        return {"valid": False, "errors": errors}

    return {
        "valid": True,
        "last4": card[-4:],
        "brand": "visa" if card.startswith("4") else "unknown",
    }


def sanitize_display_text(value: str) -> str:
    """Strip script tags for safe display."""
    return re.sub(r"<[^>]+>", "", value or "").strip()


def is_sql_injection_safe(value: str) -> bool:
    dangerous = ("--", ";", "DROP", "DELETE", "INSERT", "UPDATE", "UNION")
    upper = (value or "").upper()
    return not any(token in upper for token in dangerous)
