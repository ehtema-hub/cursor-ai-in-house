from flask import Flask, g
from flasgger import Swagger
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.config import config_by_name
from app.extensions import db, jwt, ma
from app.models import Category, User
from app.routes.auth import auth_bp
from app.routes.categories import categories_bp
from app.routes.posts import posts_bp, search_bp
from app.services.cache import cache
from app.utils.errors import register_error_handlers


def create_app(config_name: str = "development") -> Flask:
    flask_app = Flask(__name__)
    flask_app.config.from_object(config_by_name[config_name])

    db.init_app(flask_app)
    ma.init_app(flask_app)
    jwt.init_app(flask_app)
    cache.init_app(flask_app)

    register_error_handlers(flask_app)

    Swagger(
        flask_app,
        template={
            "swagger": "2.0",
            "info": {
                "title": "Blog Platform API",
                "description": "REST API for a blogging platform with JWT authentication",
                "version": "1.0.0",
            },
            "securityDefinitions": {
                "Bearer": {
                    "type": "apiKey",
                    "name": "Authorization",
                    "in": "header",
                    "description": "JWT Authorization header. Example: Bearer <token>",
                }
            },
        },
    )

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        return db.session.get(User, int(jwt_data["sub"]))

    @flask_app.before_request
    def attach_current_user():
        """Store authenticated user on flask.g when a valid JWT is present."""
        g.current_user = None
        try:
            verify_jwt_in_request(optional=True)
            identity = get_jwt_identity()
            if identity is not None:
                g.current_user = db.session.get(User, int(identity))
        except Exception:
            g.current_user = None

    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(posts_bp)
    flask_app.register_blueprint(search_bp)
    flask_app.register_blueprint(categories_bp)

    @flask_app.route("/health")
    def health():
        return {"status": "ok", "service": "blog-api"}

    @flask_app.cli.command("seed")
    def seed_data():
        """Seed categories, demo authors, posts, and comments."""
        from app.models import Category, Comment, Post, User
        from app.seed_data import seed_blog_demo

        seed_blog_demo(db, User, Category, Post, Comment)

    return flask_app
