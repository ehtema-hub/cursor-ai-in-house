#!/usr/bin/env python3
"""
Aggregate QA module outputs into a unified HTML Quality Dashboard.
Returns exit code 0 only when all quality gates pass.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "qa-suite/reporting/output"
THRESHOLDS = json.loads((ROOT / "qa-suite/config/thresholds.json").read_text())


def read_json(path: Path, default: dict | None = None) -> dict:
    if not path.exists():
        return default or {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return default or {}


def to_float(value, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def gate(name: str, passed: bool, detail: str, metrics: dict | None = None) -> dict:
    return {
        "name": name,
        "status": "pass" if passed else "fail",
        "passed": passed,
        "detail": detail,
        "metrics": metrics or {},
    }


def evaluate_gates() -> tuple[list[dict], bool]:
    gates: list[dict] = []
    all_pass = True

    # Code quality
    eslint = read_json(OUT / "code-quality/eslint-summary.json")
    pylint = read_json(OUT / "code-quality/pylint-summary.json")
    complexity = read_json(OUT / "code-quality/complexity-python.json")
    coverage = read_json(OUT / "code-quality/coverage-frontend.json")

    lint_ok = (
        eslint.get("errors", 0) == 0
        and eslint.get("complexityViolations", 0) == 0
        and to_float(pylint.get("score", 0)) >= THRESHOLDS["lint"]["minPylintScore"]
        and complexity.get("passed", True)
    )
    gates.append(gate(
        "Linting & Complexity",
        lint_ok,
        f"ESLint {eslint.get('errors', 0)} errors, {eslint.get('complexityViolations', 0)} CC violations; Pylint {pylint.get('score', 0)}/10",
        {**eslint, **pylint, "pythonComplexityViolations": len(complexity.get("violations", []))},
    ))

    cov_min = THRESHOLDS["coverage"]["minimumPercent"]
    cov_pct = to_float(coverage.get("coveragePercent", 0))
    cov_passed = coverage.get("passed")
    if isinstance(cov_passed, bool):
        cov_ok = cov_passed
    else:
        cov_ok = cov_pct >= cov_min
    gates.append(gate(
        "Code Coverage",
        cov_ok,
        f"Frontend coverage {cov_pct}% (minimum {cov_min}%)",
        coverage,
    ))

    # Security
    snyk = read_json(OUT / "security/snyk-summary.json")
    zap = read_json(OUT / "security/zap-summary.json")
    sec_ok = snyk.get("critical", 0) == 0 and zap.get("critical", 0) == 0
    gates.append(gate(
        "Security (0 Critical)",
        sec_ok,
        f"Snyk critical={snyk.get('critical', 0)}, ZAP critical={zap.get('critical', 0)}",
        {"snyk": snyk, "zap": zap},
    ))

    # UI tests
    ui = read_json(OUT / "ui-tests/summary.json")
    ui_ok = ui.get("failed", 1) == 0 and ui.get("total", 0) > 0
    gates.append(gate(
        "UI / E2E Tests",
        ui_ok,
        f"{ui.get('passed', 0)}/{ui.get('total', 0)} passed ({ui.get('passRate', 0)*100:.0f}%)",
        ui,
    ))

    # Performance
    k6 = read_json(OUT / "performance/k6-summary.json")
    perf_ok = k6.get("passed", False)
    metrics = k6.get("metrics", {})
    gates.append(gate(
        "Performance (k6)",
        perf_ok,
        f"avg {metrics.get('avgMs', 0):.0f}ms, error rate {(metrics.get('errorRate', 0)*100):.2f}%",
        k6,
    ))

    for g in gates:
        if not g["passed"]:
            all_pass = False
    return gates, all_pass


def bar(pct: float, color: str) -> str:
    pct = max(0, min(100, pct))
    return f'<div class="bar-track"><div class="bar-fill" style="width:{pct}%;background:{color}"></div></div>'


def render_html(gates: list[dict], overall: str) -> str:
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    gate_rows = ""
    for g in gates:
        color = "#22c55e" if g["passed"] else "#ef4444"
        pct = 100 if g["passed"] else max(15, 40)
        gate_rows += f"""
        <div class="card">
          <div class="card-head">
            <h3>{g['name']}</h3>
            <span class="badge {'pass' if g['passed'] else 'fail'}">{g['status'].upper()}</span>
          </div>
          {bar(pct, color)}
          <p class="detail">{g['detail']}</p>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>QA Quality Dashboard</title>
  <style>
    :root {{ --bg:#0b1220; --card:#151f32; --text:#e8eef9; --muted:#8ba3c7; }}
    * {{ box-sizing:border-box; margin:0; padding:0; }}
    body {{ font-family:Inter,system-ui,sans-serif; background:var(--bg); color:var(--text); padding:2rem; }}
    h1 {{ font-size:1.8rem; margin-bottom:.25rem; }}
    .sub {{ color:var(--muted); margin-bottom:2rem; }}
    .overall {{ display:inline-block; padding:.4rem 1rem; border-radius:999px; font-weight:700; margin-bottom:2rem; }}
    .overall.pass {{ background:#14532d; color:#4ade80; }}
    .overall.fail {{ background:#450a0a; color:#f87171; }}
    .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1rem; }}
    .card {{ background:var(--card); border:1px solid #243552; border-radius:12px; padding:1.25rem; }}
    .card-head {{ display:flex; justify-content:space-between; align-items:center; margin-bottom:.75rem; }}
    .card h3 {{ font-size:1rem; }}
    .badge {{ font-size:.7rem; font-weight:700; padding:.2rem .6rem; border-radius:999px; }}
    .badge.pass {{ background:#14532d; color:#4ade80; }}
    .badge.fail {{ background:#450a0a; color:#f87171; }}
    .bar-track {{ height:8px; background:#1e2d47; border-radius:4px; overflow:hidden; margin-bottom:.75rem; }}
    .bar-fill {{ height:100%; border-radius:4px; transition:width .3s; }}
    .detail {{ color:var(--muted); font-size:.875rem; line-height:1.5; }}
    .trends {{ margin-top:2rem; }}
    .trends h2 {{ margin-bottom:1rem; font-size:1.2rem; }}
    table {{ width:100%; border-collapse:collapse; }}
    th,td {{ text-align:left; padding:.6rem; border-bottom:1px solid #243552; font-size:.875rem; }}
    th {{ color:var(--muted); }}
  </style>
</head>
<body>
  <h1>QA Quality Dashboard</h1>
  <p class="sub">Unified DevSecOps report — {ts}</p>
  <div class="overall {'pass' if overall == 'PASS' else 'fail'}">{overall}</div>
  <div class="grid">{gate_rows}</div>
  <section class="trends">
    <h2>Quality Gate Summary</h2>
    <table>
      <tr><th>Gate</th><th>Status</th><th>Detail</th></tr>
      {''.join(f"<tr><td>{g['name']}</td><td>{g['status'].upper()}</td><td>{g['detail']}</td></tr>" for g in gates)}
    </table>
  </section>
</body>
</html>"""


def build_frontend_summary(gates: list[dict]) -> dict:
    """Build in-app QA dashboard payload from qa-suite report artifacts."""
    eslint = read_json(OUT / "code-quality/eslint-summary.json")
    pylint = read_json(OUT / "code-quality/pylint-summary.json")
    coverage = read_json(OUT / "code-quality/coverage-frontend.json")
    jest = read_json(OUT / "code-quality/jest-results.json")
    ui = read_json(OUT / "ui-tests/summary.json")
    k6 = read_json(OUT / "performance/k6-summary.json")
    snyk = read_json(OUT / "security/snyk-summary.json")
    zap = read_json(OUT / "security/zap-summary.json")

    qa_auto = ROOT / "qa-automation/reports/output"
    if not jest:
        jest = read_json(qa_auto / "tests/jest-results.json")
    pytest_unit = read_json(qa_auto / "tests/unit-pytest-summary.json")
    pytest_integration = read_json(qa_auto / "tests/integration-pytest-summary.json")

    jest_passed = jest.get("numPassedTests", 0) if jest else 0
    jest_failed = jest.get("numFailedTests", 0) if jest else 0
    jest_total = jest.get("numTotalTests", 0) if jest else 0
    cov_pct = to_float(coverage.get("coveragePercent", 0))

    if jest_total > 0:
        jest_status = "pass" if jest_failed == 0 else "fail"
    elif coverage.get("passed"):
        jest_status = "pass"
    else:
        jest_status = "unknown"

    ui_passed = ui.get("passed", 0)
    ui_failed = ui.get("failed", 0)
    ui_total = ui.get("total", 0)
    if ui_total > 0:
        ui_status = "pass" if ui_failed == 0 else "fail"
    else:
        ui_status = "unknown"

    backend_cov = to_float(
        pytest_integration.get("coveragePercent")
        or pytest_unit.get("coveragePercent")
        or 0
    )
    if backend_cov >= 80:
        backend_status = "pass"
    elif backend_cov > 0:
        backend_status = "warn"
    else:
        backend_status = "unknown"

    k6_metrics = k6.get("metrics", {})
    lint_gate = next((g for g in gates if g["name"] == "Linting & Complexity"), None)
    sec_gate = next((g for g in gates if g["name"] == "Security (0 Critical)"), None)
    perf_gate = next((g for g in gates if g["name"] == "Performance (k6)"), None)

    overall = "pass" if all(g["passed"] for g in gates) else "fail"

    return {
        "runId": "qa-suite",
        "source": "qa-suite",
        "commit": "local",
        "branch": "local",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overallStatus": overall,
        "qualityGates": [
            {
                "name": g["name"],
                "status": g["status"],
                "detail": g["detail"],
                "passed": g["passed"],
            }
            for g in gates
        ],
        "gates": {
            "unit_frontend": {
                "status": jest_status,
                "coverage": cov_pct,
                "passed": jest_passed,
                "failed": jest_failed,
                "total": jest_total,
            },
            "ui_e2e": {
                "status": ui_status,
                "passed": ui_passed,
                "failed": ui_failed,
                "total": ui_total,
            },
            "unit_backend": {
                "status": backend_status,
                "coverage": backend_cov,
                "unit": pytest_unit,
                "integration": pytest_integration,
            },
            "lint": {
                "status": "pass" if lint_gate and lint_gate["passed"] else "fail",
                "eslintErrors": eslint.get("errors", eslint.get("errorCount", 0)),
                "eslintWarnings": eslint.get("warnings", eslint.get("warningCount", 0)),
                "pylintScore": pylint.get("score", 0),
                "pylintIssues": pylint.get("issueCount", 0),
            },
            "performance": {
                "status": "pass" if perf_gate and perf_gate["passed"] else "fail",
                "lighthousePerformance": 0,
                "lighthouseAccessibility": 0,
                "k6P95Ms": k6_metrics.get("p95Ms"),
                "k6AvgMs": k6_metrics.get("avgMs"),
                "k6ErrorRate": k6_metrics.get("errorRate"),
            },
            "security": {
                "status": "pass" if sec_gate and sec_gate["passed"] else "fail",
                "zapHigh": zap.get("high", 0),
                "zapMedium": zap.get("medium", 0),
                "zapLow": zap.get("low", 0),
                "zapCritical": zap.get("critical", 0),
                "snykHigh": snyk.get("high", 0),
                "snykMedium": snyk.get("medium", 0),
                "snykCritical": snyk.get("critical", 0),
            },
        },
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    gates, all_pass = evaluate_gates()
    overall = "PASS" if all_pass else "FAIL"

    summary = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "overallStatus": overall.lower(),
        "gates": {g["name"]: g for g in gates},
    }
    (OUT / "summary.json").write_text(json.dumps(summary, indent=2))
    frontend_qa = ROOT / "frontend/public/qa"
    frontend_qa.mkdir(parents=True, exist_ok=True)
    (frontend_qa / "summary.json").write_text(
        json.dumps(build_frontend_summary(gates), indent=2)
    )

    html = render_html(gates, overall)
    (OUT / "dashboard.html").write_text(html)
    (ROOT / "qa-suite/reporting/dashboard.html").write_text(html)

    print(f"Dashboard: {OUT / 'dashboard.html'}")
    print(f"Overall: {overall}")
    for g in gates:
        icon = "✓" if g["passed"] else "✗"
        print(f"  {icon} {g['name']}: {g['detail']}")

    return 0 if all_pass else 1


if __name__ == "__main__":
    sys.exit(main())
