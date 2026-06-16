from flask import Flask

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

    @app.route("/health")
    def health_check():
        return {"status": "ok", "service": "taskflow-api", "version": "v1"}

    return app
