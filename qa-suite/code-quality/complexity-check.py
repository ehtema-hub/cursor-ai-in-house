#!/usr/bin/env python3
"""Analyze cyclomatic complexity for Python (radon) and enforce threshold."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
THRESHOLDS = json.loads((ROOT / "qa-suite/config/thresholds.json").read_text())
MAX_CC = THRESHOLDS["complexity"]["maxCyclomatic"]
OUT = ROOT / "qa-suite/reporting/output/code-quality"
TARGET = ROOT / "backend/app"


def ensure_radon() -> None:
    try:
        import radon  # noqa: F401
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "radon"])


def analyze_python() -> dict:
    ensure_radon()
    result = subprocess.run(
        [sys.executable, "-m", "radon", "cc", str(TARGET), "-j", "-a"],
        capture_output=True,
        text=True,
    )
    violations: list[dict] = []
    if result.returncode == 0 and result.stdout.strip():
        data = json.loads(result.stdout)
        for filepath, blocks in data.items():
            for block in blocks:
                rank = block.get("rank", "A")
                complexity = block.get("complexity", 0)
                if complexity > MAX_CC:
                    violations.append({
                        "file": filepath,
                        "name": block.get("name"),
                        "complexity": complexity,
                        "lineno": block.get("lineno"),
                    })
    return {
        "language": "python",
        "maxAllowed": MAX_CC,
        "violations": violations,
        "passed": len(violations) == 0,
    }


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    report = analyze_python()
    (OUT / "complexity-python.json").write_text(json.dumps(report, indent=2))
    print(f"Python complexity: {len(report['violations'])} violation(s) (max {MAX_CC})")
    for v in report["violations"][:10]:
        print(f"  {v['file']}:{v['lineno']} {v['name']} CC={v['complexity']}")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    sys.exit(main())
