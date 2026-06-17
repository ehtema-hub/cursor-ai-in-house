import importlib

from flask import Flask, g

from app.celery_app import init_celery
from app.config import config_by_name
from app.extensions import api, db, jwt, ma, migrate
from app.services.cache import cache
from app.utils.errors import register_error_handlers


def create_app(config_name: str = "development") -> Flask:
    flask_app = Flask(__name__)
    flask_app.config.from_object(config_by_name[config_name])

    db.init_app(flask_app)
    ma.init_app(flask_app)
    jwt.init_app(flask_app)
    migrate.init_app(flask_app, db)
    api.init_app(flask_app)
    cache.init_app(flask_app)
    init_celery(flask_app)

    register_error_handlers(flask_app)

    importlib.import_module("app.tasks.background")

    from app.blueprints.routes import register_blueprints

    register_blueprints(api)

    @flask_app.before_request
    def apply_rate_limit():
        from flask import request

        if not request.path.startswith("/api/"):
            return None
        if request.path.startswith("/api/auth/register") or request.path.startswith("/api/auth/login"):
            return None

        from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

        try:
            verify_jwt_in_request(optional=True)
            g.rate_limit_user_id = get_jwt_identity()
        except Exception:
            g.rate_limit_user_id = None

        from app.support.rate_limit import rate_limiter

        rate_limiter.max_requests = flask_app.config["RATE_LIMIT_MAX_REQUESTS"]
        rate_limiter.window_seconds = flask_app.config["RATE_LIMIT_WINDOW_SECONDS"]
        rate_limiter.check()
        return None

    @flask_app.route("/health")
    def health_check():
        return {"status": "ok", "service": "taskflow-support-api", "version": "v1"}

    return flask_app
