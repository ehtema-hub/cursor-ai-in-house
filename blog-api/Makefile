.PHONY: setup test run seed

VENV := .venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip
PYTEST := $(VENV)/bin/pytest

setup:
	@test -d $(VENV) || python3 -m venv $(VENV)
	$(PIP) install -r requirements.txt

test: setup
	$(PYTEST) -v

run: setup
	$(PYTHON) run.py

seed: setup
	$(VENV)/bin/flask seed
