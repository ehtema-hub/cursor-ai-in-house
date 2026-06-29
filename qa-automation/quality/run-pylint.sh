#!/usr/bin/env bash
# Run Pylint and write JSON reports for qa-automation dashboard.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-automation/reports/output/lint"
RCFILE="$ROOT/qa-automation/quality/pylint.rc"
mkdir -p "$OUT"

set +e
cd "$ROOT/backend"
if [ -f .venv/bin/activate ]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
elif [ -f venv/bin/activate ]; then
  # shellcheck source=/dev/null
  source venv/bin/activate
fi
pip install -q pylint 2>/dev/null || true
pylint app --rcfile="$RCFILE" --output-format=json > "$OUT/pylint.json" 2>/dev/null
SCORE="$(pylint app --rcfile="$RCFILE" 2>&1 | grep -oE 'rated at [0-9.]+' | head -1 | awk '{print $3}')"
SCORE="${SCORE:-0}"
set -e

cd "$ROOT"
node -e "
const fs = require('fs');
const output = process.argv[1];
const score = parseFloat(process.argv[2]) || 0;
fs.writeFileSync(output, JSON.stringify({ score, issueCount: 0 }));
" "$OUT/pylint-summary.json" "$SCORE"

echo "Pylint score: $SCORE"
