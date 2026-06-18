#!/usr/bin/env bash
# Frontend unit tests (Jest).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
cd "$ROOT"

mkdir -p qa-automation/reports/output/tests qa-automation/reports/output/coverage/frontend

npx jest \
  --config qa-automation/tests/unit/jest.config.cjs \
  --coverage \
  --json \
  --outputFile=qa-automation/reports/output/tests/jest-results.json
