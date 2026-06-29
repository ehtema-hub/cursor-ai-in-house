#!/usr/bin/env bash
# Run Snyk when SNYK_TOKEN is set and valid; otherwise skip without failing CI.
set -euo pipefail

TARGET="${1:-}"
shift || true
ARGS=("$@")

if [ -z "${SNYK_TOKEN:-}" ]; then
  echo "SNYK_TOKEN not set — skipping Snyk scan"
  exit 0
fi

http_code="$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token ${SNYK_TOKEN}" \
  https://api.snyk.io/v1/user/me || echo "000")"

if [ "$http_code" != "200" ]; then
  echo "SNYK_TOKEN invalid or unauthorized (HTTP ${http_code}) — skipping Snyk scan"
  echo "Provide a valid SNYK_TOKEN secret or set repository variable SNYK_ENABLED=false"
  exit 0
fi

case "$TARGET" in
  npm)
    (
      cd frontend
      npx snyk@latest test "${ARGS[@]}"
    )
    ;;
  python)
    npx snyk@latest test "${ARGS[@]}"
    ;;
  *)
    echo "Usage: run-snyk.sh <npm|python> [snyk args...]" >&2
    exit 2
    ;;
esac
