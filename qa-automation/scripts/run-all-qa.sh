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
step "ESLint" bash -c "
  npx eslint frontend/src -c qa-automation/quality/eslint.config.js -f json -o $REPORTS/lint/eslint.json || true
  node -e \"
    const fs=require('fs'); const p='$REPORTS/lint/eslint.json';
    const r=fs.existsSync(p)?JSON.parse(fs.readFileSync(p)):[]; 
    const s={errorCount:r.reduce((a,f)=>a+f.errorCount,0),warningCount:r.reduce((a,f)=>a+f.warningCount,0)};
    fs.writeFileSync('$REPORTS/lint/eslint-summary.json',JSON.stringify(s));
    console.log('ESLint',s.errorCount,'errors',s.warningCount,'warnings');
  \"
" || true

step "Pylint" bash -c "
  cd backend && pip install -q pylint 2>/dev/null; 
  pylint app --rcfile=../qa-automation/quality/pylint.rc --output-format=json > ../$REPORTS/lint/pylint.json 2>/dev/null || true
  score=\$(pylint app --rcfile=../qa-automation/quality/pylint.rc --score-only 2>/dev/null | tail -1 | awk '{print \$NF}' || echo 0)
  node -e \"fs.writeFileSync('../$REPORTS/lint/pylint-summary.json',JSON.stringify({score:parseFloat('$score')||0,issueCount:0}))\"
  echo Pylint score: \$score
" || true

# --- Performance ---
step "Lighthouse" bash -c "
  cd frontend && npm run build
  npx @lhci/cli autorun --config=../qa-automation/performance/lighthouse.config.js || true
  node -e \"
    const fs=require('fs'),path=require('path');
    const dir='$REPORTS/lighthouse';
    let scores={performance:0,accessibility:0,'best-practices':0,seo:0};
    if(fs.existsSync(dir)) for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.json'))) {
      try { const d=JSON.parse(fs.readFileSync(path.join(dir,f))); const c=d.categories||d.lhr?.categories||{};
        for(const k of Object.keys(scores)) if(c[k]?.score!=null) scores[k]=Math.round(c[k].score*100);
      } catch{}
    }
    fs.writeFileSync('$REPORTS/lighthouse/summary.json',JSON.stringify({scores}));
  \"
" || true

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
