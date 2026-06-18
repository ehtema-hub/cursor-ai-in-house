#!/usr/bin/env bash
# Smoke performance test — asserts API health endpoints respond under threshold.
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:5000}"
THRESHOLD_MS="${PERF_THRESHOLD_MS:-500}"
REQUESTS="${PERF_REQUESTS:-20}"

endpoints=(
  "/health"
)

fail=0
for path in "${endpoints[@]}"; do
  url="${BASE_URL}${path}"
  total=0
  ok=0
  for _ in $(seq 1 "$REQUESTS"); do
    start=$(python3 -c "import time; print(int(time.time()*1000))")
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" || echo "000")
    end=$(python3 -c "import time; print(int(time.time()*1000))")
    elapsed=$((end - start))
    total=$((total + elapsed))
    if [ "$code" = "200" ]; then
      ok=$((ok + 1))
    fi
  done
  avg=$((total / REQUESTS))
  echo "PERF $path avg=${avg}ms ok=$ok/$REQUESTS threshold=${THRESHOLD_MS}ms"
  if [ "$ok" -lt "$REQUESTS" ]; then
    echo "ERROR: $path returned non-200 responses"
    fail=1
  fi
  if [ "$avg" -gt "$THRESHOLD_MS" ]; then
    echo "ERROR: $path average ${avg}ms exceeds ${THRESHOLD_MS}ms"
    fail=1
  fi
done

exit $fail
