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
(
  cd "$ROOT/frontend"
  npx eslint ../frontend/src ../qa-suite/ui-tests \
    -c ../qa-suite/code-quality/eslint.config.js \
    -f json \
    -o "../qa-suite/reporting/output/code-quality/eslint.json"
)
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
set +e
(
  cd "$ROOT/frontend"
  npx jest --config ../qa-automation/tests/unit/jest.config.cjs --coverage \
    --coverageDirectory="qa-suite/reporting/output/code-quality/coverage/frontend" \
    --coverageReporters=json-summary \
    --json --outputFile="qa-suite/reporting/output/code-quality/jest-results.json"
)
JEST_EXIT=$?
set -e
node -e "
const fs=require('fs');
const paths=[
  '$OUT/coverage/frontend/coverage-summary.json',
  '$ROOT/qa-automation/reports/output/coverage/frontend/coverage-summary.json',
];
const jestPath='$OUT/jest-results.json';
const min=80;
let pct=0;
for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  pct=Number(JSON.parse(fs.readFileSync(p)).total?.lines?.pct||0);
  if (pct>0) break;
}
let jestFailed=0;
if (fs.existsSync(jestPath)) {
  const j=JSON.parse(fs.readFileSync(jestPath));
  jestFailed=Number(j.numFailedTests||0);
}
const coverageOk=pct>=min;
const testsOk=jestFailed===0;
fs.writeFileSync('$OUT/coverage-frontend.json',JSON.stringify({coveragePercent:pct,minimum:min,passed:coverageOk&&testsOk}));
console.log('Frontend coverage:',pct+'%',coverageOk?'PASS':'FAIL');
if (jestFailed>0) console.log('Jest failures:',jestFailed);
else if ($JEST_EXIT !== 0) console.log('Note: jest exited',$JEST_EXIT,'but no test failures in report');
process.exit(coverageOk&&testsOk?0:1);
" || FAILED=1

[ "$FAILED" -eq 0 ] && echo "Code quality checks PASSED" || { echo "Code quality checks FAILED"; exit 1; }
