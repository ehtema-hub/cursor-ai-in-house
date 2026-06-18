#!/usr/bin/env bash
# API performance smoke test (curl-based).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
REPORTS="$ROOT/qa-automation/reports/output/performance"
mkdir -p "$REPORTS"

BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"
THRESHOLD_MS="${PERF_THRESHOLD_MS:-500}"
REQUESTS="${PERF_REQUESTS:-20}"

bash "$ROOT/scripts/ci/performance-test.sh" "$BASE_URL"

python3 - <<PY
import json, subprocess, time
from pathlib import Path
from datetime import datetime, timezone

base = "$BASE_URL"
threshold = int("$THRESHOLD_MS")
requests = int("$REQUESTS")
times = []
ok = 0
for _ in range(requests):
    start = time.time()
    r = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "5", f"{base}/health"], capture_output=True, text=True)
    elapsed = int((time.time() - start) * 1000)
    times.append(elapsed)
    if r.stdout.strip() == "200":
        ok += 1
avg = sum(times) // len(times) if times else 0
summary = {
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "baseUrl": base,
    "avgMs": avg,
    "thresholdMs": threshold,
    "successRate": ok / requests if requests else 0,
    "passed": ok == requests and avg <= threshold,
}
out = Path("$REPORTS/smoke-summary.json")
out.write_text(json.dumps(summary, indent=2))
print(f"Smoke test avg={avg}ms ok={ok}/{requests}")
raise SystemExit(0 if summary["passed"] else 1)
PY
