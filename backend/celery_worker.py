"""Celery worker entry point."""

from app import create_app
from app.celery_app import celery

flask_app = create_app()
celery_app = celery
