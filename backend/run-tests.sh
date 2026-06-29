#!/usr/bin/env bash
# Run backend pytest from the correct directory with venv + test env.
set -euo pipefail

cd "$(dirname "$0")"

if [ -f .venv/bin/activate ]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
elif [ -f venv/bin/activate ]; then
  # shellcheck source=/dev/null
  source venv/bin/activate
else
  echo "No Python virtualenv found in backend/."
  echo "Create one with:"
  echo "  cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

if ! command -v pytest >/dev/null 2>&1; then
  echo "pytest is not installed in the active virtualenv."
  echo "Run: pip install -r requirements.txt"
  exit 1
fi

export FLASK_ENV=testing
export JWT_SECRET_KEY="${JWT_SECRET_KEY:-qa-test-jwt-secret-key-32chars!!}"
export CELERY_TASK_ALWAYS_EAGER=true

exec pytest "$@"
