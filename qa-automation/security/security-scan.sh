#!/usr/bin/env bash
# Unified security scanning — OWASP ZAP + Snyk.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
REPORTS="$ROOT/qa-automation/reports/output/security"
mkdir -p "$REPORTS"

TARGET_URL="${TARGET_URL:-http://127.0.0.1:4173}"
export TARGET_URL REPORT_DIR="$REPORTS"

echo "=== Security Scan ==="

# OWASP ZAP baseline
if command -v docker >/dev/null 2>&1; then
  echo ">>> OWASP ZAP baseline"
  NETWORK_FLAG=""
  [ "${CI:-}" = "true" ] && NETWORK_FLAG="--network host"
  docker run --rm ${NETWORK_FLAG} \
    -v "$REPORTS:/zap/wrk:rw" \
    ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py -t "$TARGET_URL" \
    -J /zap/wrk/zap-report.json -r /zap/wrk/zap-report.html -I || true

  python3 - <<PY
import json
from pathlib import Path
from datetime import datetime, timezone

report = Path("${REPORTS}/zap-report.json")
summary = {"timestamp": datetime.now(timezone.utc).isoformat(), "high": 0, "medium": 0, "low": 0, "informational": 0, "total": 0}
if report.exists():
    data = json.loads(report.read_text())
    for site in data.get("site", []):
        for alert in site.get("alerts", []):
            risk = str(alert.get("riskdesc", alert.get("riskcode", ""))).lower()
            if "high" in risk: summary["high"] += 1
            elif "medium" in risk: summary["medium"] += 1
            elif "low" in risk: summary["low"] += 1
            else: summary["informational"] += 1
            summary["total"] += 1
Path("${REPORTS}/zap-summary.json").write_text(json.dumps(summary, indent=2))
print("ZAP:", summary)
PY
else
  echo "Docker not available — skipping ZAP"
fi

# Snyk (optional — requires SNYK_TOKEN)
if [ -n "${SNYK_TOKEN:-}" ]; then
  echo ">>> Snyk (npm)"
  cd "$ROOT"
  npx snyk test --severity-threshold=high --json-file-output="$REPORTS/snyk-npm.json" || true
  echo ">>> Snyk (python)"
  snyk test --file=backend/requirements.txt --severity-threshold=high \
    --json-file-output="$REPORTS/snyk-python.json" || true

  python3 - <<PY
import json
from pathlib import Path

out = Path("${REPORTS}")
high = medium = low = 0
for name in ("snyk-npm.json", "snyk-python.json"):
    p = out / name
    if not p.exists():
        continue
    try:
        data = json.loads(p.read_text())
        for v in data.get("vulnerabilities", []):
            s = (v.get("severity") or "").lower()
            if s in ("high", "critical"): high += 1
            elif s == "medium": medium += 1
            else: low += 1
    except Exception:
        pass
(out / "snyk-summary.json").write_text(json.dumps({"high": high, "medium": medium, "low": low}, indent=2))
print(f"Snyk: high={high} medium={medium} low={low}")
PY
else
  echo "SNYK_TOKEN not set — skipping Snyk"
  echo '{"high":0,"medium":0,"low":0}' > "$REPORTS/snyk-summary.json"
fi

echo "Security scan complete — reports in $REPORTS"
