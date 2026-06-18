#!/usr/bin/env bash
# OWASP ZAP baseline container scan — fails on critical vulnerabilities.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-suite/reporting/output/security"
TARGET_URL="${TARGET_URL:-http://127.0.0.1:4173}"
mkdir -p "$OUT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker required for OWASP ZAP"
  exit 1
fi

echo ">>> OWASP ZAP baseline against $TARGET_URL"
NETWORK_FLAG=""
[ "${CI:-}" = "true" ] && NETWORK_FLAG="--network host"

docker run --rm ${NETWORK_FLAG} \
  -v "$OUT:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t "$TARGET_URL" \
  -J /zap/wrk/zap-report.json \
  -r /zap/wrk/zap-report.html \
  -I || true

python3 - <<PY
import json
from pathlib import Path

report = Path("$OUT/zap-report.json")
summary = {"critical": 0, "high": 0, "medium": 0, "low": 0, "informational": 0, "total": 0}
if report.exists():
    data = json.loads(report.read_text())
    for site in data.get("site", []):
        for alert in site.get("alerts", []):
            risk = str(alert.get("riskdesc", alert.get("riskcode", ""))).lower()
            if "critical" in risk:
                summary["critical"] += 1
            elif "high" in risk:
                summary["high"] += 1
            elif "medium" in risk:
                summary["medium"] += 1
            elif "low" in risk:
                summary["low"] += 1
            else:
                summary["informational"] += 1
            summary["total"] += 1
Path("$OUT/zap-summary.json").write_text(json.dumps(summary, indent=2))
print("ZAP:", summary)
raise SystemExit(1 if summary["critical"] > 0 else 0)
PY
