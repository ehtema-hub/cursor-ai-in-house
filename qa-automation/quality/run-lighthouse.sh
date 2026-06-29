#!/usr/bin/env bash
# Build frontend and run Lighthouse CI summary for qa-automation reports.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="$ROOT/qa-automation/reports/output/lighthouse"
mkdir -p "$OUT"

cd "$ROOT/frontend"
npm run build
set +e
npx @lhci/cli autorun --config="$ROOT/qa-automation/performance/lighthouse.config.js"
set -e

node -e "
const fs = require('fs');
const path = require('path');
const dir = process.argv[1];
const output = process.argv[2];
const scores = { performance: 0, accessibility: 0, 'best-practices': 0, seo: 0 };

if (fs.existsSync(dir)) {
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
      const categories = data.categories || data.lhr?.categories || {};
      for (const key of Object.keys(scores)) {
        if (categories[key]?.score != null) {
          scores[key] = Math.round(categories[key].score * 100);
        }
      }
    } catch {
      // ignore malformed lighthouse artifacts
    }
  }
}

fs.writeFileSync(output, JSON.stringify({ scores }));
" "$OUT" "$OUT/summary.json"
