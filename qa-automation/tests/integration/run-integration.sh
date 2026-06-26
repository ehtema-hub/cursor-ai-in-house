#!/usr/bin/env bash
# Backend integration tests (API suites).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
REPORTS="$ROOT/qa-automation/reports/output"
cd "$ROOT/backend"

if [ -f .venv/bin/activate ]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
elif [ -f venv/bin/activate ]; then
  # shellcheck source=/dev/null
  source venv/bin/activate
else
  echo "No virtualenv in backend/. Run: cd backend && python -m venv .venv && pip install -r requirements.txt"
  exit 1
fi

mkdir -p "$REPORTS/tests" "$REPORTS/coverage/backend"

export FLASK_ENV=testing
export JWT_SECRET_KEY=qa-test-jwt-secret-key-32chars!!

INTEGRATION_PATHS=(
  tests/test_rest_api_suite.py
  tests/test_support_tickets.py
  tests/test_user_profile_management.py
)

pytest -q "${INTEGRATION_PATHS[@]}" \
  --override-ini='addopts=' \
  --cov=app.blueprints --cov=app.support \
  --cov-report=json:"$REPORTS/coverage/backend/integration-coverage.json" \
  --junitxml="$REPORTS/tests/integration-pytest-junit.xml"

python3 - <<PY
import json
from pathlib import Path
cov = Path("$REPORTS/coverage/backend/integration-coverage.json")
summary = {"suite": "integration", "coveragePercent": 0}
if cov.exists():
    data = json.loads(cov.read_text())
    summary["coveragePercent"] = round(data.get("totals", {}).get("percent_covered", 0), 1)
Path("$REPORTS/tests/integration-pytest-summary.json").write_text(json.dumps(summary, indent=2))
Path("$REPORTS/tests/pytest-summary.json").write_text(json.dumps(summary, indent=2))
print(f"Integration coverage: {summary['coveragePercent']}%")
PY
