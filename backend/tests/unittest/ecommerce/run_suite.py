#!/usr/bin/env python3
"""Run e-commerce checkout unittest suite."""

from __future__ import annotations

import argparse
import sys
import unittest
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[3]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from tests.unittest.ecommerce import (  # noqa: E402
    test_cart,
    test_discounts,
    test_notifications,
    test_orders,
    test_payment,
    test_security,
)


def build_suite() -> unittest.TestSuite:
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    for module in (
        test_cart,
        test_discounts,
        test_payment,
        test_orders,
        test_notifications,
        test_security,
    ):
        suite.addTests(loader.loadTestsFromModule(module))
    return suite


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="E-commerce checkout unittest runner")
    parser.add_argument("pattern", nargs="?", help="Optional test name filter")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args(argv)

    if args.pattern:
        suite = unittest.TestLoader().loadTestsFromName(args.pattern)
    else:
        suite = build_suite()

    result = unittest.TextTestRunner(verbosity=2 if args.verbose else 1).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
