#!/usr/bin/env bash
# Run ESLint and write JSON reports for qa-automation dashboard.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-automation/reports/output/lint"
cd "$ROOT"
mkdir -p "$OUT"

set +e
npx eslint frontend/src \
  -c "$ROOT/qa-automation/quality/eslint.config.js" \
  -f json \
  -o "$OUT/eslint.json"
set -e

node -e "
const fs = require('fs');
const input = process.argv[1];
const output = process.argv[2];
const results = fs.existsSync(input) ? JSON.parse(fs.readFileSync(input, 'utf8')) : [];
const summary = {
  errorCount: results.reduce((total, file) => total + file.errorCount, 0),
  warningCount: results.reduce((total, file) => total + file.warningCount, 0),
};
fs.writeFileSync(output, JSON.stringify(summary));
console.log('ESLint', summary.errorCount, 'errors', summary.warningCount, 'warnings');
" "$OUT/eslint.json" "$OUT/eslint-summary.json"
