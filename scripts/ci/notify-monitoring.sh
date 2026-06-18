#!/usr/bin/env bash
# Post deployment event to monitoring webhook (Datadog, Slack, PagerDuty, etc.)
set -euo pipefail

WEBHOOK_URL="${MONITORING_WEBHOOK_URL:-}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "MONITORING_WEBHOOK_URL not set — skipping external notification"
  exit 0
fi

payload=$(cat <<EOF
{
  "event": "${DEPLOY_EVENT:-deploy}",
  "status": "${DEPLOY_STATUS:-success}",
  "environment": "${DEPLOY_ENV:-production}",
  "slot": "${DEPLOY_SLOT:-green}",
  "commit": "${GITHUB_SHA:-local}",
  "ref": "${GITHUB_REF:-local}",
  "workflow": "${GITHUB_WORKFLOW:-local}",
  "url": "${DEPLOY_URL:-}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

curl -fsSL -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$payload"

echo "Monitoring notification sent: ${DEPLOY_STATUS}"
