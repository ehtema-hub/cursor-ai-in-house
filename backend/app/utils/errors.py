from flask import jsonify
from flask_jwt_extended.exceptions import (
    FreshTokenRequired,
    InvalidHeaderError,
    JWTDecodeError,
    NoAuthorizationError,
    RevokedTokenError,
)
from marshmallow import ValidationError
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return jsonify({"message": "Validation error.", "errors": error.messages}), 422

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"message": "Resource not found."}), 404

    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"message": "Internal server error."}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return jsonify({"message": error.description or error.name}), error.code

    @app.errorhandler(NoAuthorizationError)
    def handle_no_auth(error):
        return jsonify({"message": "Authorization token is missing."}), 401

    @app.errorhandler(InvalidHeaderError)
    def handle_invalid_header(error):
        return jsonify({"message": "Invalid authorization header."}), 422

    @app.errorhandler(JWTDecodeError)
    def handle_jwt_decode(error):
        return jsonify({"message": "Invalid or expired token."}), 401

    @app.errorhandler(RevokedTokenError)
    def handle_revoked_token(error):
        return jsonify({"message": "Token has been revoked."}), 401

    @app.errorhandler(FreshTokenRequired)
    def handle_fresh_token(error):
        return jsonify({"message": "Fresh token required."}), 401
