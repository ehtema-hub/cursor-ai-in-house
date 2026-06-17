# E-Commerce Checkout — Test Case Specification

End-to-end test scenarios for cart management, discount codes, payment processing, order confirmation, and email notifications.

**Scope**

| Layer | Location | Status |
|-------|----------|--------|
| API (proposed) | `backend/` — `/api/cart`, `/api/checkout`, `/api/orders` | Not implemented |
| UI | `src/components/ecommerce/` — ProductCard, catalog | Add-to-cart callback only |
| E2E | `e2e/product-search.spec.ts` | Product search; checkout flow TBD |
| Business logic tests | `tests/unittest/ecommerce/` | Validation helpers + unittest |

---

## Proposed API (Checkout v1)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/cart` | Get current cart |
| POST | `/api/cart/items` | Add item `{ product_id, quantity }` |
| PUT | `/api/cart/items/:id` | Update quantity |
| DELETE | `/api/cart/items/:id` | Remove line item |
| POST | `/api/cart/discount` | Apply code `{ code }` |
| DELETE | `/api/cart/discount` | Remove applied code |
| POST | `/api/checkout/payment` | Process payment |
| POST | `/api/orders` | Create order from cart |
| GET | `/api/orders/:id` | Order confirmation details |

---

## Test Data Catalog

### Products (from catalog)

| ID | Name | Price | In stock |
|----|------|-------|----------|
| `wireless-headphones` | Aura Wireless Headphones | $149.99 | yes |
| `ceramic-mug-set` | Stoneware Mug Set | $33.00 | yes |
| `smart-watch` | Pulse Smart Watch | $299.00 | yes |
| `out-of-stock-item` | Discontinued Widget | $9.99 | no |

### Discount codes

| Code | Type | Value | Min cart | Status |
|------|------|-------|----------|--------|
| `SAVE10` | percent | 10% | $50.00 | active |
| `FLAT20` | fixed | $20.00 | $100.00 | active |
| `FREESHIP` | shipping | $0 ship | $25.00 | active |
| `EXPIRED50` | percent | 50% | $0 | expired |
| `INVALID` | — | — | — | not found |
| `MAXED` | fixed | $5 | $0 | usage limit reached |

### Valid payment (test mode)

```json
{
  "card_number": "4242424242424242",
  "exp_month": 12,
  "exp_year": 2030,
  "cvc": "123",
  "billing_email": "buyer@checkout.test",
  "billing_name": "Jordan Lee"
}
```

### Invalid payment samples

| Field | Value | Expected |
|-------|-------|----------|
| card_number | `4111111111111112` | declined / failed Luhn |
| card_number | `1234` | invalid format |
| exp_year | `2020` | expired |
| cvc | `12` | too short |
| billing_email | `not-email` | validation error |

### Security payloads

| Payload | Target field | Expected |
|---------|--------------|----------|
| `'; DROP TABLE orders;--` | discount code, name | rejected / parameterized |
| `<script>alert(1)</script>` | billing name | sanitized |
| `4242424242424242` in logs | card number | never stored/logged in full (PCI) |

### Customer

| Email | Password |
|-------|----------|
| `buyer@checkout.test` | `CheckoutPass123!` |

---

## 1. Add to Cart

### 1.1 Positive

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-CART-001 | Add single in-stock product qty 1 | `201`, line item in cart, subtotal = price |
| CHK-CART-002 | Add same product twice | Quantity increments or second line merged |
| CHK-CART-003 | Add multiple different products | All lines present; subtotal = sum |
| CHK-CART-004 | GET cart after add | Returns items, subtotal, item_count |
| CHK-CART-005 | Update quantity via PUT | Subtotal recalculated |
| CHK-CART-006 | Remove item via DELETE | Item gone; subtotal updated |

### 1.2 Negative

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-CART-N01 | Add out-of-stock product | `400` / `409` |
| CHK-CART-N02 | Invalid product_id | `404` |
| CHK-CART-N03 | Quantity zero or negative | `422` |
| CHK-CART-N04 | Quantity exceeds max (e.g. 99) | `422` |
| CHK-CART-N05 | Unauthenticated if cart requires auth | `401` (if policy) |

### 1.3 Edge

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-CART-E01 | Empty cart GET | `200`, items=[], subtotal=0 |
| CHK-CART-E02 | Max quantity boundary (99) | Accepted |
| CHK-CART-E03 | Float price product rounding | Totals rounded to 2 decimals |
| CHK-CART-E04 | Concurrent add same SKU | Consistent final quantity |

### 1.4 Security

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-CART-S01 | SQLi in product_id | `404` or safe rejection |
| CHK-CART-S02 | Price tampering in request body | Server uses catalog price, not client price |

---

## 2. Discount Codes

### 2.1 Positive

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-DSC-001 | Apply SAVE10 on $149.99 cart | 10% off; new total ~$134.99 |
| CHK-DSC-002 | Apply FLAT20 on $149.99 cart | Fails min $100? — on $149.99 succeeds, -$20 |
| CHK-DSC-003 | Remove discount | Totals revert to pre-discount |
| CHK-DSC-004 | FREESHIP on eligible cart | shipping_fee = 0 |

### 2.2 Negative

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-DSC-N01 | Invalid code INVALID | `404` or `400` |
| CHK-DSC-N02 | Expired EXPIRED50 | `400` expired |
| CHK-DSC-N03 | Below minimum order for SAVE10 ($50) on $33 cart | `400` min not met |
| CHK-DSC-N04 | Empty code string | `422` |
| CHK-DSC-N05 | Double-apply two codes | `400` one code per order |
| CHK-DSC-N06 | MAXED code usage limit | `400` |

### 2.3 Edge

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-DSC-E01 | Discount exceeds subtotal (100% off) | Total floor at $0.00 |
| CHK-DSC-E02 | Case-insensitive code `save10` | Accepted |
| CHK-DSC-E03 | Apply then change cart below minimum | Discount removed or checkout blocked |

### 2.4 Security

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-DSC-S01 | SQLi in code field | No DB error; safe rejection |
| CHK-DSC-S02 | Brute-force many codes | Rate limited |

---

## 3. Payment Processing

### 3.1 Positive

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-PAY-001 | Valid test card succeeds | `200`, payment_status= succeeded |
| CHK-PAY-002 | Payment intent amount matches cart total | Amount equals server total |
| CHK-PAY-003 | Idempotency key replay | Same result, single charge |

### 3.2 Negative

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-PAY-N01 | Declined card 4111...1112 | `402` / payment_failed |
| CHK-PAY-N02 | Invalid card number format | `422` |
| CHK-PAY-N03 | Expired card | `422` |
| CHK-PAY-N04 | Invalid CVC | `422` |
| CHK-PAY-N05 | Empty cart checkout | `400` |
| CHK-PAY-N06 | Amount mismatch (client total ≠ server) | `400` |

### 3.3 Edge

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-PAY-E01 | Network timeout retry | Idempotent; no double charge |
| CHK-PAY-E02 | Zero-dollar order (100% discount) | Succeeds without card or minimal flow |

### 3.4 Security

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-PAY-S01 | Full PAN not in API response | Only last4 + brand |
| CHK-PAY-S02 | CVV not persisted | Never stored post-auth |
| CHK-PAY-S03 | PCI: HTTPS required | Reject non-TLS in production |

---

## 4. Order Confirmation

### 4.1 Positive

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-ORD-001 | Create order after payment | `201`, order_number, status= confirmed |
| CHK-ORD-002 | GET order by id | Line items, totals, shipping address |
| CHK-ORD-003 | Cart cleared after order | Cart empty |
| CHK-ORD-004 | Order number format | `ORD-YYYYMMDD-XXXX` |

### 4.2 Negative

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-ORD-N01 | GET other user's order | `403` |
| CHK-ORD-N02 | Order without completed payment | `400` |

### 4.3 Edge

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-ORD-E01 | Duplicate submit double-click | One order created |

---

## 5. Email Notifications

### 5.1 Positive

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-EML-001 | Order confirmation email sent | To billing_email with order_number |
| CHK-EML-002 | Email contains line items and total | Matches order record |
| CHK-EML-003 | Payment receipt email | Sent on successful payment |

### 5.2 Negative

| ID | Scenario | Expected |
|----|----------|----------|
| CHK-EML-N01 | Invalid email on order | `422` at checkout |
| CHK-EML-N02 | Email service down | Order still created; retry queue |

---

## 6. Automation

| Module | File | Status |
|--------|------|--------|
| Cart validation | `tests/unittest/ecommerce/test_cart.py` | Logic + API skipped |
| Discounts | `tests/unittest/ecommerce/test_discounts.py` | Logic + API skipped |
| Payment | `tests/unittest/ecommerce/test_payment.py` | Validation + API skipped |
| Orders | `tests/unittest/ecommerce/test_orders.py` | API skipped |
| Notifications | `tests/unittest/ecommerce/test_notifications.py` | Mock email skipped |
| Security | `tests/unittest/ecommerce/test_security.py` | Logic tests active |

```bash
cd backend
python -m tests.unittest.ecommerce.run_suite -v
```
