"""Celery application factory integrated with Flask."""

from celery import Celery

celery = Celery("taskflow")


def init_celery(app) -> Celery:
    eager = app.config.get("CELERY_TASK_ALWAYS_EAGER", False)
    broker_url = app.config["CELERY_BROKER_URL"]
    result_backend = app.config["CELERY_RESULT_BACKEND"]

    # Eager mode executes tasks in-process; avoid Redis broker/result store locally.
    if eager:
        broker_url = "memory://"
        result_backend = "cache+memory://"

    celery.conf.update(
        broker_url=broker_url,
        result_backend=result_backend,
        task_always_eager=eager,
        task_eager_propagates=app.config.get("CELERY_TASK_EAGER_PROPAGATES", True),
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        beat_schedule=app.config.get("CELERY_BEAT_SCHEDULE", {}),
    )

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    celery.flask_app = app
    return celery
