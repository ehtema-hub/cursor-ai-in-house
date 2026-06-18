#!/usr/bin/env python3
"""Aggregate QA reports into unified summary for dashboard."""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "reports" / "output"
PUBLIC_QA = ROOT.parent / "public" / "qa"


def read_json(path: Path, default=None):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return default


def gate(status: str) -> dict:
    return {"status": status, "passed": status == "pass"}


def jest_summary() -> dict:
    results = read_json(REPORTS / "tests" / "jest-results.json")
    coverage = read_json(REPORTS / "coverage" / "frontend" / "coverage-summary.json")
    if not results:
        return {**gate("unknown"), "coverage": 0, "passed": 0, "failed": 0, "total": 0}
    passed = results.get("numPassedTests", 0)
    failed = results.get("numFailedTests", 0)
    total = results.get("numTotalTests", 0)
    cov = (coverage or {}).get("total", {}).get("lines", {}).get("pct", 0)
    status = "pass" if failed == 0 and total > 0 else "fail" if failed else "unknown"
    return {**gate(status), "coverage": cov, "passed": passed, "failed": failed, "total": total}


def pytest_summary() -> dict:
    unit = read_json(REPORTS / "tests" / "unit-pytest-summary.json", {})
    integration = read_json(REPORTS / "tests" / "integration-pytest-summary.json", {})
    combined = read_json(REPORTS / "tests" / "pytest-summary.json", {})
    pct = combined.get("coveragePercent") or integration.get("coveragePercent") or unit.get("coveragePercent", 0)
    status = "pass" if pct >= 80 else "warn" if pct > 0 else "unknown"
    return {**gate(status), "coverage": pct, "unit": unit, "integration": integration}


def lint_summary() -> dict:
    eslint = read_json(REPORTS / "lint" / "eslint-summary.json", {"errorCount": 0, "warningCount": 0})
    pylint = read_json(REPORTS / "lint" / "pylint-summary.json", {"score": 0, "issueCount": 0})
    if eslint.get("errorCount", 0) > 0:
        status = "fail"
    elif pylint.get("score", 0) < 7:
        status = "warn"
    elif pylint.get("score", 0) >= 7:
        status = "pass"
    else:
        status = "unknown"
    return {
        **gate(status),
        "eslintErrors": eslint.get("errorCount", 0),
        "eslintWarnings": eslint.get("warningCount", 0),
        "pylintScore": pylint.get("score", 0),
        "pylintIssues": pylint.get("issueCount", 0),
    }


def perf_summary() -> dict:
    lighthouse = read_json(REPORTS / "lighthouse" / "summary.json", {"scores": {}})
    k6 = read_json(REPORTS / "performance" / "k6-summary.json", {"metrics": {}})
    scores = lighthouse.get("scores", {})
    perf_score = scores.get("performance", 0)
    p95 = (k6.get("metrics") or {}).get("http_req_duration_p95")
    if perf_score >= 65 and (p95 is None or p95 < 500):
        status = "pass"
    elif perf_score > 0 or p95 is not None:
        status = "fail" if perf_score < 50 or (p95 is not None and p95 >= 500) else "warn"
    else:
        status = "unknown"
    return {
        **gate(status),
        "lighthousePerformance": perf_score,
        "lighthouseAccessibility": scores.get("accessibility", 0),
        "k6P95Ms": p95,
        "k6FailedRate": (k6.get("metrics") or {}).get("http_req_failed_rate"),
    }


def security_summary() -> dict:
    zap = read_json(REPORTS / "security" / "zap-summary.json", {})
    snyk = read_json(REPORTS / "security" / "snyk-summary.json", {})
    high = zap.get("high", 0) + snyk.get("high", 0)
    medium = zap.get("medium", 0) + snyk.get("medium", 0)
    status = "fail" if high > 0 else "warn" if medium > 3 else "pass"
    return {
        **gate(status),
        "zapHigh": zap.get("high", 0),
        "zapMedium": zap.get("medium", 0),
        "zapLow": zap.get("low", 0),
        "snykHigh": snyk.get("high", 0),
        "snykMedium": snyk.get("medium", 0),
    }


def main() -> int:
    gates = {
        "unit_frontend": jest_summary(),
        "unit_backend": pytest_summary(),
        "lint": lint_summary(),
        "performance": perf_summary(),
        "security": security_summary(),
    }
    statuses = [g["status"] for g in gates.values()]
    if "fail" in statuses:
        overall = "fail"
    elif "warn" in statuses:
        overall = "warn"
    elif all(s == "pass" for s in statuses):
        overall = "pass"
    else:
        overall = "unknown"

    summary = {
        "runId": os.environ.get("GITHUB_RUN_ID", "local"),
        "commit": (os.environ.get("GITHUB_SHA") or "local")[:7],
        "branch": os.environ.get("GITHUB_REF_NAME", "local"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overallStatus": overall,
        "gates": gates,
    }

    REPORTS.mkdir(parents=True, exist_ok=True)
    PUBLIC_QA.mkdir(parents=True, exist_ok=True)
    out = REPORTS / "summary.json"
    out.write_text(json.dumps(summary, indent=2))
    (PUBLIC_QA / "summary.json").write_text(json.dumps(summary, indent=2))
    print(f"QA summary written to {out}")
    print(f"Overall status: {overall}")
    return 1 if overall == "fail" else 0


if __name__ == "__main__":
    sys.exit(main())
