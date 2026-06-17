#!/usr/bin/env python3
"""
Run all user profile management unittest modules.

Usage:
    cd backend
    python -m tests.unittest.run_suite
    python -m tests.unittest.run_suite -v
    python tests/unittest/run_suite.py RegistrationPositiveTests
"""

from __future__ import annotations

import argparse
import sys
import unittest
from pathlib import Path

# Ensure backend root is on sys.path when executed as a script
BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from tests.unittest import test_account_deletion  # noqa: E402
from tests.unittest import test_password_changes  # noqa: E402
from tests.unittest import test_profile_updates  # noqa: E402
from tests.unittest import test_registration  # noqa: E402


def build_suite() -> unittest.TestSuite:
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    for module in (
        test_registration,
        test_profile_updates,
        test_password_changes,
        test_account_deletion,
    ):
        suite.addTests(loader.loadTestsFromModule(module))
    return suite


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="User profile management unittest runner")
    parser.add_argument(
        "pattern",
        nargs="?",
        help="Optional test class or method name filter (e.g. RegistrationPositiveTests)",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    args = parser.parse_args(argv)

    if args.pattern:
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromName(args.pattern)
    else:
        suite = build_suite()

    runner = unittest.TextTestRunner(verbosity=2 if args.verbose else 1)
    result = runner.run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
