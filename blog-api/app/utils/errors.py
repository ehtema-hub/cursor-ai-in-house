from flask import jsonify
from flask_jwt_extended.exceptions import (
    InvalidHeaderError,
    JWTDecodeError,
    NoAuthorizationError,
)
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"error": "Validation failed.", "details": error.messages}), 400

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": error.description or "Bad request."}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({"error": error.description or "Unauthorized."}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"error": error.description or "Forbidden."}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": error.description or "Resource not found."}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error."}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return jsonify({"error": error.description or error.name}), error.code

    @app.errorhandler(NoAuthorizationError)
    def handle_no_auth(error):
        return jsonify({"error": "Authorization token is missing."}), 401

    @app.errorhandler(InvalidHeaderError)
    def handle_invalid_header(error):
        return jsonify({"error": "Invalid authorization header."}), 401

    @app.errorhandler(JWTDecodeError)
    def handle_jwt_decode(error):
        return jsonify({"error": "Invalid or expired token."}), 401
