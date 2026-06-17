#!/usr/bin/env bash
# Run blog-api tests with an auto-provisioned virtualenv.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [ ! -d .venv ]; then
  echo "Creating virtualenv in blog-api/.venv ..."
  python3 -m venv .venv
fi

echo "Installing dependencies ..."
.venv/bin/pip install -q -r requirements.txt

echo "Running pytest ..."
exec .venv/bin/pytest "$@"
