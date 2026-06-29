#!/usr/bin/env bash
# Run ESLint, Pylint, and cyclomatic complexity checks.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-suite/reporting/output/code-quality"
cd "$ROOT"
mkdir -p "$OUT"

FAILED=0

echo ">>> ESLint (complexity ≤ 10)"
set +e
npx eslint frontend/src qa-suite/ui-tests -c qa-suite/code-quality/eslint.config.js -f json -o "$OUT/eslint.json"
ESLINT_EXIT=$?
set -e

node -e "
const fs=require('fs');
const r=fs.existsSync('$OUT/eslint.json')?JSON.parse(fs.readFileSync('$OUT/eslint.json')):[];
const errors=r.reduce((a,f)=>a+f.errorCount,0);
const warnings=r.reduce((a,f)=>a+f.warningCount,0);
const complexity=r.flatMap(f=>f.messages.filter(m=>m.ruleId==='complexity'));
fs.writeFileSync('$OUT/eslint-summary.json',JSON.stringify({errors,warnings,complexityViolations:complexity.length}));
console.log('ESLint:',errors,'errors,',warnings,'warnings,',complexity.length,'complexity violations');
process.exit(errors>0||complexity.length>0?1:0);
" || FAILED=1

echo ">>> Pylint"
set +e
cd backend
pip install -q pylint 2>/dev/null || true
pylint app --rcfile=../qa-suite/code-quality/pylint.rc --output-format=json > "$OUT/pylint.json" 2>/dev/null
PYLINT_EXIT=$?
SCORE=$(pylint app --rcfile=../qa-suite/code-quality/pylint.rc 2>&1 | grep -oE 'rated at [0-9.]+' | head -1 | awk '{print $3}')
SCORE="${SCORE:-0}"
MIN_PYLINT=7.5
cd "$ROOT"
node -e "require('fs').writeFileSync('$OUT/pylint-summary.json',JSON.stringify({score:parseFloat('$SCORE')||0,minimum:$MIN_PYLINT,passed:parseFloat('$SCORE')>=$MIN_PYLINT}))"
echo "Pylint score: $SCORE (minimum $MIN_PYLINT)"
node -e "process.exit(parseFloat('$SCORE')>=$MIN_PYLINT?0:1)" || FAILED=1

echo ">>> Python cyclomatic complexity (radon)"
python3 qa-suite/code-quality/complexity-check.py || FAILED=1

echo ">>> Jest unit coverage gate (≥80%)"
mkdir -p "$OUT/coverage/frontend"
npx jest --config qa-automation/tests/unit/jest.config.cjs --coverage \
  --coverageDirectory="$OUT/coverage/frontend" \
  --coverageReporters=json-summary \
  --json --outputFile="$OUT/jest-results.json" \
  --silent 2>/dev/null || true
node -e "
const fs=require('fs');
const p='$OUT/coverage/frontend/coverage-summary.json';
const min=80;
let pct=0;
if(fs.existsSync(p)) pct=JSON.parse(fs.readFileSync(p)).total?.lines?.pct||0;
fs.writeFileSync('$OUT/coverage-frontend.json',JSON.stringify({coveragePercent:pct,minimum:min,passed:pct>=min}));
console.log('Frontend coverage:',pct+'%',pct>=min?'PASS':'FAIL');
process.exit(pct>=min?0:1);
" || FAILED=1

[ "$FAILED" -eq 0 ] && echo "Code quality checks PASSED" || { echo "Code quality checks FAILED"; exit 1; }
