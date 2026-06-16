from flask import Flask, g

from app.config import config_by_name
from app.extensions import api, db, jwt, ma, migrate
from app.utils.errors import register_error_handlers


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    api.init_app(app)

    register_error_handlers(app)

    from app.blueprints.routes import register_blueprints

    register_blueprints(api)

    @app.before_request
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

        rate_limiter.max_requests = app.config["RATE_LIMIT_MAX_REQUESTS"]
        rate_limiter.window_seconds = app.config["RATE_LIMIT_WINDOW_SECONDS"]
        rate_limiter.check()
        return None

    @app.route("/health")
    def health_check():
        return {"status": "ok", "service": "taskflow-support-api", "version": "v1"}

    return app
