#!/usr/bin/env bash
# Post CI failure/success alerts to Slack incoming webhook.
set -euo pipefail

WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
if [ -z "$WEBHOOK_URL" ]; then
  echo "SLACK_WEBHOOK_URL not set — skipping Slack notification"
  exit 0
fi

STATUS="${NOTIFY_STATUS:-failure}"
WORKFLOW="${GITHUB_WORKFLOW:-CI}"
RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-local}/actions/runs/${GITHUB_RUN_ID:-0}"
COMMIT="${GITHUB_SHA:-local}"
REF="${GITHUB_REF_NAME:-local}"
ACTOR="${GITHUB_ACTOR:-ci}"
FAILED_JOBS="${FAILED_JOBS:-unknown}"

if [ "$STATUS" = "success" ]; then
  EMOJI=":white_check_mark:"
  COLOR="#36a64f"
  TITLE="CI passed"
else
  EMOJI=":x:"
  COLOR="#e01e5a"
  TITLE="CI failed"
fi

payload=$(cat <<EOF
{
  "attachments": [
    {
      "color": "${COLOR}",
      "blocks": [
        {
          "type": "header",
          "text": { "type": "plain_text", "text": "${EMOJI} ${TITLE}: ${WORKFLOW}" }
        },
        {
          "type": "section",
          "fields": [
            { "type": "mrkdwn", "text": "*Branch*\n\`${REF}\`" },
            { "type": "mrkdwn", "text": "*Actor*\n${ACTOR}" },
            { "type": "mrkdwn", "text": "*Commit*\n\`${COMMIT:0:7}\`" },
            { "type": "mrkdwn", "text": "*Failed jobs*\n${FAILED_JOBS}" }
          ]
        },
        {
          "type": "actions",
          "elements": [
            {
              "type": "button",
              "text": { "type": "plain_text", "text": "View workflow run" },
              "url": "${RUN_URL}"
            }
          ]
        }
      ]
    }
  ]
}
EOF
)

curl -fsSL -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$payload"

echo "Slack notification sent (${STATUS})"
