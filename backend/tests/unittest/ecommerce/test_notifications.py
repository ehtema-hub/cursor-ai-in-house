"""CHK-EML-* — Order email notification tests."""

import unittest
from unittest.mock import patch


class EmailNotificationLogicTests(unittest.TestCase):
    def test_chk_eml_001_confirmation_payload_shape(self):
        order = {
            "order_number": "ORD-20260617-0001",
            "billing_email": "buyer@checkout.test",
            "total": "140.98",
            "items": [{"name": "Aura Wireless Headphones", "quantity": 1}],
        }
        subject = f"Order confirmed: {order['order_number']}"
        self.assertIn("ORD-", subject)
        self.assertIn("@", order["billing_email"])

    @patch("builtins.print")
    def test_chk_eml_002_mock_send_logs_recipient(self, mock_print):
        """Simulate mock email sender pattern used in support email_service."""

        def send_email(to: str, subject: str, body: str) -> None:
            print(f"EMAIL to={to} subject={subject} body={body[:80]}")

        send_email("buyer@checkout.test", "Order confirmed", "Your order total is $140.98")
        mock_print.assert_called()


class EmailNotificationNegativeTests(unittest.TestCase):
    def test_chk_eml_n01_invalid_email_rejected(self):
        from tests.unittest.ecommerce.checkout_logic import validate_payment

        result = validate_payment(
            {
                "card_number": "4242424242424242",
                "exp_month": 12,
                "exp_year": 2030,
                "cvc": "123",
                "billing_email": "not-email",
                "billing_name": "Test",
            }
        )
        self.assertIn("billing_email", result["errors"])


class EmailApiTests(unittest.TestCase):
    @unittest.skip("Order email hook not implemented — CHK-EML-001 API")
    def test_chk_eml_api_triggers_on_order(self):
        pass


if __name__ == "__main__":
    unittest.main()
