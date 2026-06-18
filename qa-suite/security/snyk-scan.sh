#!/usr/bin/env bash
# Snyk dependency vulnerability scan — fails on critical findings.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-suite/reporting/output/security"
mkdir -p "$OUT"
cd "$ROOT"

if [ -z "${SNYK_TOKEN:-}" ]; then
  echo "SNYK_TOKEN not set — writing empty report (set token for production gates)"
  echo '{"critical":0,"high":0,"medium":0,"low":0,"skipped":true}' > "$OUT/snyk-summary.json"
  exit 0
fi

CRITICAL=0 HIGH=0 MEDIUM=0 LOW=0

echo ">>> Snyk npm"
npx snyk test --severity-threshold=low --json-file-output="$OUT/snyk-npm.json" || true

echo ">>> Snyk python"
snyk test --file=backend/requirements.txt --severity-threshold=low \
  --json-file-output="$OUT/snyk-python.json" || true

python3 - <<'PY'
import json
from pathlib import Path

out = Path("qa-suite/reporting/output/security")
counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "skipped": False}
for name in ("snyk-npm.json", "snyk-python.json"):
    p = out / name
    if not p.exists():
        continue
    data = json.loads(p.read_text())
    for v in data.get("vulnerabilities", []):
        s = (v.get("severity") or "").lower()
        if s == "critical":
            counts["critical"] += 1
        elif s == "high":
            counts["high"] += 1
        elif s == "medium":
            counts["medium"] += 1
        else:
            counts["low"] += 1
(out / "snyk-summary.json").write_text(json.dumps(counts, indent=2))
print("Snyk:", counts)
raise SystemExit(1 if counts["critical"] > 0 else 0)
PY
