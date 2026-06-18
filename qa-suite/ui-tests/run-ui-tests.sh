#!/usr/bin/env bash
# Run Playwright UI tests with JSON report for dashboard aggregation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
OUT="$ROOT/qa-suite/reporting/output/ui-tests"
cd "$ROOT"

mkdir -p "$OUT"

npx playwright test \
  --config qa-suite/config/playwright.config.ts \
  --project=chromium

# Summarize for gate checks
node -e "
const fs = require('fs');
const p = '$OUT/results.json';
if (!fs.existsSync(p)) { console.error('Missing UI test results'); process.exit(1); }
const r = JSON.parse(fs.readFileSync(p, 'utf8'));
const passed = (r.suites || []).reduce((s, suite) => s + countPassed(suite), 0);
const failed = (r.suites || []).reduce((s, suite) => s + countFailed(suite), 0);
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
const summary = { passed, failed, total: passed + failed, passRate: passed / (passed + failed || 1) };
fs.writeFileSync('$OUT/summary.json', JSON.stringify(summary, null, 2));
console.log('UI tests:', summary);
process.exit(failed > 0 ? 1 : 0);
"
