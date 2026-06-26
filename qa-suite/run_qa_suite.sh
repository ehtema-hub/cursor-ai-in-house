#!/usr/bin/env bash
# =============================================================================
# QA Suite — Master Execution Script
# Pipeline: Linting → Security → UI Tests → Performance → Dashboard
# Exit 0 only when ALL quality gates pass.
# =============================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT="$ROOT/qa-suite/reporting/output"
LOG="$OUT/qa-suite.log"
mkdir -p "$OUT"/{code-quality,security,ui-tests,performance}

# Load environment
if [ -f "$ROOT/qa-suite/config/env.example" ]; then
  set -a
  # shellcheck source=/dev/null
  source "$ROOT/qa-suite/config/env.example"
  set +a
fi

exec > >(tee -a "$LOG") 2>&1

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          QA Suite — DevSecOps Quality Pipeline           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Reports: $OUT"

FAILED=0
PHASE=0

run_phase() {
  PHASE=$((PHASE + 1))
  local name="$1"
  shift
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " Phase $PHASE: $name"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if "$@"; then
    echo "✓ Phase $PHASE ($name) PASSED"
  else
    echo "✗ Phase $PHASE ($name) FAILED"
    FAILED=1
  fi
}

# Optional: start services for security/performance if not running
start_services() {
  if ! curl -sf http://127.0.0.1:5000/health >/dev/null 2>&1; then
    echo "Starting backend API on :5000..."
    (
      cd "$ROOT/backend"
      if [ -f .venv/bin/activate ]; then
        # shellcheck source=/dev/null
        source .venv/bin/activate
      elif [ -f venv/bin/activate ]; then
        # shellcheck source=/dev/null
        source venv/bin/activate
      fi
      export FLASK_ENV=development
      export FLASK_DEBUG=0
      export CELERY_TASK_ALWAYS_EAGER=true
      export ALLOW_TEST_RESET=1
      export RATE_LIMIT_MAX_REQUESTS=1000000
      export RATE_LIMIT_WINDOW_SECONDS=60
      flask db upgrade 2>/dev/null || true
      python run.py
    ) &
    BACKEND_PID=$!
    for i in $(seq 1 30); do curl -sf http://127.0.0.1:5000/health && break; sleep 1; done
  fi
  if ! curl -sf http://127.0.0.1:4173 >/dev/null 2>&1; then
    echo "Building frontend for preview on :4173..."
    (cd "$ROOT/frontend" && npm run build)
    echo "Starting frontend preview on :4173..."
    (cd "$ROOT/frontend" && npm run preview -- --port 4173 --host --strictPort) &
    PREVIEW_PID=$!
    PREVIEW_READY=0
    for i in $(seq 1 60); do
      if curl -sf http://127.0.0.1:4173 >/dev/null 2>&1; then
        PREVIEW_READY=1
        echo "Frontend preview ready on :4173"
        break
      fi
      sleep 2
    done
    if [ "$PREVIEW_READY" -ne 1 ]; then
      echo "ERROR: Frontend preview failed to start on :4173"
      exit 1
    fi
  fi
  export TARGET_URL=http://127.0.0.1:4173
  export API_URL=http://127.0.0.1:5000
  export UI_BASE_URL=http://127.0.0.1:4173
}

cleanup() {
  [ "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null || true
  [ "${PREVIEW_PID:-}" ] && kill "$PREVIEW_PID" 2>/dev/null || true
}
trap cleanup EXIT

# ─── Phase 1: Code Quality (Lint + Complexity + Coverage) ───
run_phase "Code Quality (ESLint, Pylint, Complexity ≤10, Coverage ≥80%)" \
  bash "$ROOT/qa-suite/code-quality/run-lint.sh"

# ─── Phase 2: Security (Snyk + OWASP ZAP, 0 Critical) ───
start_services
run_phase "Security Scanning (Snyk + OWASP ZAP)" \
  bash "$ROOT/qa-suite/security/run-security.sh"

# ─── Phase 3: UI / E2E Tests (Playwright POM) ───
start_services
run_phase "UI / E2E Tests (Playwright)" \
  bash "$ROOT/qa-suite/ui-tests/run-ui-tests.sh"

# ─── Phase 4: Performance (k6 load test) ───
start_services
run_phase "Performance Load Test (k6)" \
  bash "$ROOT/qa-suite/performance/run-k6.sh"

# ─── Phase 5: Generate HTML Dashboard & Enforce Gates ───
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Phase 5: Generate Quality Dashboard"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

GATE_EXIT=0
python3 "$ROOT/qa-suite/reporting/generate-dashboard.py" || GATE_EXIT=1

echo ""
echo "══════════════════════════════════════════════════════════"
if [ "$FAILED" -eq 0 ] && [ "$GATE_EXIT" -eq 0 ]; then
  echo " QA SUITE PASSED — All quality gates met"
  echo " Dashboard: file://$OUT/dashboard.html"
  exit 0
else
  echo " QA SUITE FAILED — Review $OUT/dashboard.html"
  exit 1
fi
