#!/usr/bin/env bash
# Emit comma-separated failed job names from needs.*.result JSON (via env).
set -euo pipefail

NEEDS_JSON="${1:-{}}"
python3 - <<'PY' "$NEEDS_JSON"
import json, sys
raw = sys.argv[1] if len(sys.argv) > 1 else "{}"
try:
    needs = json.loads(raw)
except json.JSONDecodeError:
    needs = {}
failed = [name for name, job in needs.items() if job.get("result") in ("failure", "cancelled")]
print(", ".join(failed) if failed else "none")
PY
