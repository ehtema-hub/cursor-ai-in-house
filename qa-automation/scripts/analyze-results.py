#!/usr/bin/env python3
"""AI-style QA improvement recommendations from aggregated metrics."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "reports" / "output"
PUBLIC_QA = ROOT.parent / "frontend" / "public" / "qa"

PRIORITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}


def load_summary() -> dict | None:
    frontend_qa = ROOT.parent / "frontend" / "public" / "qa" / "summary.json"
    for path in (REPORTS / "summary.json", frontend_qa):
        if path.exists():
            return json.loads(path.read_text())
    return None


def recommend(summary: dict | None) -> list[dict]:
    recs: list[dict] = []
    gates = (summary or {}).get("gates", {})

    jest = gates.get("unit_frontend", {})
    if jest.get("status") == "fail" or jest.get("failed", 0) > 0:
        recs.append({
            "priority": "critical",
            "category": "testing",
            "title": "Fix failing Jest unit tests",
            "detail": f"{jest.get('failed', 0)} frontend unit test(s) failed. Run tests in qa-automation/tests/unit/frontend/.",
            "impact": "Prevents UI logic bugs from reaching production.",
        })
    elif jest.get("coverage", 0) < 70:
        recs.append({
            "priority": "high",
            "category": "testing",
            "title": "Increase frontend unit test coverage",
            "detail": f"Jest coverage is {jest.get('coverage', 0)}%. Target ≥70% on src/lib.",
            "impact": "Higher confidence in refactors and faster feedback than E2E alone.",
        })

    pytest = gates.get("unit_backend", {})
    if pytest.get("coverage", 0) < 85:
        recs.append({
            "priority": "high",
            "category": "testing",
            "title": "Expand backend pytest coverage",
            "detail": f"Backend coverage is {pytest.get('coverage', 0)}%. Add tests under qa-automation/tests/integration/.",
            "impact": "Reduces API regression risk and speeds up release cycles.",
        })

    lint = gates.get("lint", {})
    if lint.get("eslintErrors", 0) > 0:
        recs.append({
            "priority": "high",
            "category": "quality",
            "title": "Resolve ESLint errors",
            "detail": f"{lint['eslintErrors']} ESLint error(s). See qa-automation/quality/eslint.config.js.",
            "impact": "Consistent code style and fewer runtime bugs.",
        })
    if lint.get("pylintScore", 10) < 8:
        recs.append({
            "priority": "medium",
            "category": "quality",
            "title": "Improve Pylint score",
            "detail": f"Pylint score {lint.get('pylintScore', 'n/a')}/10. See qa-automation/quality/pylint.rc.",
            "impact": "Better maintainability for Python contributors.",
        })

    perf = gates.get("performance", {})
    if perf.get("lighthousePerformance", 100) < 70:
        recs.append({
            "priority": "high",
            "category": "performance",
            "title": "Optimize Lighthouse performance score",
            "detail": f"Lighthouse performance is {perf.get('lighthousePerformance', 0)}/100.",
            "impact": "Faster page loads improve conversion and SEO.",
        })
    if perf.get("lighthouseAccessibility", 100) < 90:
        recs.append({
            "priority": "medium",
            "category": "accessibility",
            "title": "Address accessibility gaps",
            "detail": f"Lighthouse a11y score is {perf.get('lighthouseAccessibility', 0)}/100.",
            "impact": "WCAG compliance and better UX for all users.",
        })
    p95 = perf.get("k6P95Ms")
    if p95 is not None and p95 >= 400:
        recs.append({
            "priority": "high",
            "category": "performance",
            "title": "Reduce API p95 latency",
            "detail": f"k6 p95 latency {round(p95)}ms. Tune qa-automation/performance/performance-thresholds.json.",
            "impact": "Lower tail latency improves reliability at scale.",
        })

    sec = gates.get("security", {})
    if sec.get("zapHigh", 0) > 0 or sec.get("snykHigh", 0) > 0:
        recs.append({
            "priority": "critical",
            "category": "security",
            "title": "Remediate high-severity security findings",
            "detail": f"ZAP high: {sec.get('zapHigh', 0)}, Snyk high: {sec.get('snykHigh', 0)}.",
            "impact": "Blocks exploitable vulnerabilities in production.",
        })

    if not recs:
        recs.append({
            "priority": "low",
            "category": "maintenance",
            "title": "Quality gates are healthy",
            "detail": "No critical improvements detected.",
            "impact": "Proactive hardening for future feature work.",
        })

    recs.sort(key=lambda r: PRIORITY_ORDER.get(r["priority"], 99))
    return recs


def main() -> int:
    summary = load_summary()
    recommendations = recommend(summary)
    output = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "basedOn": (summary or {}).get("timestamp"),
        "overallStatus": (summary or {}).get("overallStatus", "unknown"),
        "recommendationCount": len(recommendations),
        "recommendations": recommendations,
    }

    REPORTS.mkdir(parents=True, exist_ok=True)
    PUBLIC_QA.mkdir(parents=True, exist_ok=True)
    (REPORTS / "recommendations.json").write_text(json.dumps(output, indent=2))
    (PUBLIC_QA / "recommendations.json").write_text(json.dumps(output, indent=2))

    md_lines = [
        "# QA Improvement Recommendations",
        "",
        f"Generated: {output['generatedAt']}",
        f"Overall status: **{output['overallStatus']}**",
        "",
    ]
    for i, r in enumerate(recommendations, 1):
        md_lines += [
            f"## {i}. [{r['priority'].upper()}] {r['title']}",
            "",
            f"**Category:** {r['category']}",
            "",
            r["detail"],
            "",
            f"*Impact:* {r['impact']}",
            "",
        ]
    (REPORTS / "recommendations.md").write_text("\n".join(md_lines))

    print(f"Generated {len(recommendations)} recommendation(s)")
    for r in recommendations:
        print(f"  [{r['priority']}] {r['title']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
