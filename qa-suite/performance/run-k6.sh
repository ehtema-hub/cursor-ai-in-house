#!/usr/bin/env bash
# Run k6 load test with ramp-up VUs and KPI gates.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-suite/reporting/output/performance"
mkdir -p "$OUT"
cd "$ROOT"

API_URL="${API_URL:-http://127.0.0.1:5000}"

if ! command -v k6 >/dev/null 2>&1; then
  echo "k6 not installed — install via: brew install k6"
  exit 1
fi

if ! curl -sf "$API_URL/health" >/dev/null 2>&1; then
  echo "API not reachable at $API_URL — start backend first"
  exit 1
fi

echo "Waiting for stable API health before k6..."
for i in $(seq 1 15); do
  if curl -sf "$API_URL/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

set +e
k6 run \
  -e API_URL="$API_URL" \
  -e MAX_AVG_MS=500 \
  -e MAX_ERROR_RATE=0.01 \
  qa-suite/performance/k6-load-test.js
K6_EXIT=$?
set -e

python3 -c "
import json, sys
from pathlib import Path
p = Path('qa-suite/reporting/output/performance/k6-summary.json')
if not p.exists():
    sys.exit(1)
s = json.loads(p.read_text())
sys.exit(0 if s.get('passed') else 1)
"
GATE_EXIT=$?

if [ "$K6_EXIT" -ne 0 ] || [ "$GATE_EXIT" -ne 0 ]; then
  exit 1
fi
