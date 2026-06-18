#!/usr/bin/env bash
# Post-deploy health checks for GitHub Pages frontend.
set -euo pipefail

URL="${DEPLOY_URL:-}"
if [ -z "$URL" ]; then
  echo "No deployment URL — skipping URL checks"
  exit 0
fi

echo "Running production health checks against ${URL}"

# 1) Root page returns 200
for i in 1 2 3 4 5; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "${URL}" || echo "000")
  if [ "$code" = "200" ]; then
    echo "Root page health check passed (${code})"
    break
  fi
  if [ "$i" -eq 5 ]; then
    echo "Root page health check failed (last status: ${code})"
    exit 1
  fi
  sleep 10
done

# 2) Static assets reachable (index.html contains root mount)
body=$(curl -fsSL --max-time 15 "${URL}" || true)
if ! echo "$body" | grep -qi '<div id="root"'; then
  echo "SPA mount point not found in deployed HTML"
  exit 1
fi
echo "SPA content check passed"

# 3) Response time smoke (3 samples, warn if slow)
total=0
for _ in 1 2 3; do
  ms=$(curl -s -o /dev/null -w "%{time_total}" --max-time 15 "${URL}" | awk '{printf "%.0f", $1 * 1000}')
  total=$((total + ms))
done
avg=$((total / 3))
echo "Average response time: ${avg}ms"
if [ "$avg" -gt 3000 ]; then
  echo "Warning: average response time exceeds 3000ms"
fi

echo "Production health checks passed"
