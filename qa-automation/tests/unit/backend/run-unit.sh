#!/usr/bin/env bash
# Backend unit tests (pytest core modules).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
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

UNIT_PATHS=(
  tests/test_auth.py
  tests/test_permissions.py
  tests/test_tasks.py
  tests/test_task_service.py
  tests/test_notifications.py
  tests/test_cache_service.py
)

pytest -q "${UNIT_PATHS[@]}" \
  --override-ini='addopts=' \
  --cov=app.services --cov=app.models.task --cov=app.models.project \
  --cov-report=json:"$REPORTS/coverage/backend/unit-coverage.json" \
  --junitxml="$REPORTS/tests/unit-pytest-junit.xml"

python3 - <<PY
import json
from pathlib import Path
cov = Path("$REPORTS/coverage/backend/unit-coverage.json")
summary = {"suite": "unit", "coveragePercent": 0}
if cov.exists():
    data = json.loads(cov.read_text())
    summary["coveragePercent"] = round(data.get("totals", {}).get("percent_covered", 0), 1)
Path("$REPORTS/tests/unit-pytest-summary.json").write_text(json.dumps(summary, indent=2))
print(f"Unit coverage: {summary['coveragePercent']}%")
PY
