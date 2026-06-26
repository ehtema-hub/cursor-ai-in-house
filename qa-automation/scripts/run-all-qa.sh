#!/usr/bin/env bash
# Master QA runner — executes full qa-automation framework.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
QA="$ROOT/qa-automation"
REPORTS="$QA/reports/output"
cd "$ROOT"

mkdir -p "$REPORTS"/{lint,tests,coverage/{frontend,backend},performance,lighthouse,security,e2e}

echo "╔══════════════════════════════════════╗"
echo "║     QA Automation Framework          ║"
echo "╚══════════════════════════════════════╝"

FAILED=0
step() {
  echo ""
  echo "▶ $1"
  shift
  if "$@"; then echo "  ✓ passed"; else echo "  ✗ failed"; FAILED=1; fi
}

# --- Tests ---
step "Unit: Jest (frontend)" bash "$QA/tests/unit/frontend/run-unit.sh" || true
step "Unit: pytest (backend)" bash "$QA/tests/unit/backend/run-unit.sh" || true
step "Integration: pytest" bash "$QA/tests/integration/run-integration.sh" || true

# --- Quality ---
step "ESLint" bash "$QA/quality/run-eslint.sh" || true

step "Pylint" bash "$QA/quality/run-pylint.sh" || true

# --- Performance ---
step "Lighthouse" bash "$QA/quality/run-lighthouse.sh" || true

if curl -sf http://127.0.0.1:5000/health >/dev/null 2>&1; then
  step "k6 load test" bash -c "
    THRESHOLDS=\$(cat qa-automation/performance/performance-thresholds.json)
    k6 run -e BASE_URL=http://127.0.0.1:5000 \
      -e K6_P95_MS=\$(node -pe 'JSON.parse(require(\"fs\").readFileSync(\"qa-automation/performance/performance-thresholds.json\")).k6.p95Ms') \
      qa-automation/performance/k6-load-test.js
  " || true
else
  echo "▶ k6 skipped (start backend on :5000)"
fi

# --- Security ---
if curl -sf http://127.0.0.1:4173 >/dev/null 2>&1 || curl -sf http://127.0.0.1:5173 >/dev/null 2>&1; then
  TARGET_URL="${TARGET_URL:-http://127.0.0.1:4173}"
  step "Security scan" bash "$QA/security/security-scan.sh" || true
else
  echo "▶ Security scan skipped (start preview on :4173)"
fi

# --- Reports ---
echo ""
echo "▶ Generating reports"
python3 "$QA/reports/generate-report.py" || true
python3 "$QA/scripts/analyze-results.py"

echo ""
echo "Dashboard: file://$QA/reports/dashboard.html"
echo "Data: $REPORTS/summary.json"
[ "$FAILED" -eq 0 ] && echo "QA suite complete ✓" || { echo "QA suite completed with failures"; exit 1; }
