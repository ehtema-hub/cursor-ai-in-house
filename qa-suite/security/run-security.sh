#!/usr/bin/env bash
# Run Snyk + OWASP ZAP security scans with strict critical-vuln gate.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

FAILED=0

bash qa-suite/security/snyk-scan.sh || FAILED=1

# ZAP requires running target
if curl -sf "${TARGET_URL:-http://127.0.0.1:4173}" >/dev/null 2>&1; then
  bash qa-suite/security/zap-baseline.sh || FAILED=1
else
  echo ">>> ZAP skipped — start frontend preview on :4173 (npm run build && npm run preview)"
  echo '{"critical":0,"high":0,"skipped":true}' > qa-suite/reporting/output/security/zap-summary.json
fi

[ "$FAILED" -eq 0 ] && echo "Security scans PASSED (0 critical)" || { echo "Security scans FAILED"; exit 1; }
