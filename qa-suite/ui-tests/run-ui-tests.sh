#!/usr/bin/env bash
# Run Playwright UI tests with JSON report for dashboard aggregation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-suite/reporting/output/ui-tests"
cd "$ROOT"

mkdir -p "$OUT"

export UI_BASE_URL="${UI_BASE_URL:-http://127.0.0.1:4173}"
API_URL="${API_URL:-http://127.0.0.1:5000}"

for i in $(seq 1 30); do
  if curl -sf "$UI_BASE_URL" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Frontend preview not reachable at $UI_BASE_URL"
    exit 1
  fi
  sleep 2
done

if curl -sf "$API_URL/health" >/dev/null 2>&1; then
  echo "Resetting backend database for UI tests..."
  curl -sf -X POST "$API_URL/api/test/reset" >/dev/null || true
fi

if [ ! -d "$ROOT/qa-suite/ui-tests/node_modules/@playwright/test" ]; then
  echo "Installing Playwright for QA UI tests..."
  npm install --prefix "$ROOT/qa-suite/ui-tests" --no-fund --no-audit
fi

echo "Ensuring Playwright Chromium browser is installed..."
npx --prefix "$ROOT/qa-suite/ui-tests" playwright install chromium

set +e
npx --prefix "$ROOT/qa-suite/ui-tests" playwright test \
  --config "$ROOT/qa-suite/ui-tests/playwright.config.mjs" \
  --project=chromium
PW_EXIT=$?
set -e

# Summarize for gate checks
UI_SUMMARY_EXIT=0
node -e "
const fs = require('fs');
const p = '$OUT/results.json';
if (!fs.existsSync(p)) { console.error('Missing UI test results'); process.exit(1); }
const r = JSON.parse(fs.readFileSync(p, 'utf8'));
const stats = r.stats || {};
let passed = stats.expected;
let failed = stats.unexpected;
if (passed === undefined || failed === undefined) {
  function countPassed(s) {
    let n = (s.specs || []).filter(x => x.ok).length;
    for (const c of s.suites || []) n += countPassed(c);
    return n;
  }
  function countFailed(s) {
    let n = (s.specs || []).filter(x => !x.ok).length;
    for (const c of s.suites || []) n += countFailed(c);
    return n;
  }
  passed = (r.suites || []).reduce((s, suite) => s + countPassed(suite), 0);
  failed = (r.suites || []).reduce((s, suite) => s + countFailed(suite), 0);
}
const total = passed + failed;
const summary = { passed, failed, total, passRate: total ? passed / total : 0 };
fs.writeFileSync('$OUT/summary.json', JSON.stringify(summary, null, 2));
console.log('UI tests:', summary);
process.exit(failed > 0 ? 1 : 0);
" || UI_SUMMARY_EXIT=$?

if [ "$PW_EXIT" -ne 0 ] || [ "$UI_SUMMARY_EXIT" -ne 0 ]; then
  exit 1
fi
