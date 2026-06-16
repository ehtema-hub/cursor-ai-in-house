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

from app.support.errors import SupportAPIError, error_response


def register_error_handlers(app):
    @app.errorhandler(SupportAPIError)
    def handle_support_api_error(error):
        return error_response(error.message, error.code, error.status_code, error.errors or None)

    @app.errorhandler(ValidationError)
    def handle_validation_error(error):
        return error_response(
            "Input validation failed.",
            "VALIDATION_ERROR",
            400,
            error.messages,
        )

    @app.errorhandler(404)
    def not_found(error):
        return error_response("Resource not found.", "NOT_FOUND", 404)

    @app.errorhandler(500)
    def internal_error(error):
        return error_response("Internal server error.", "INTERNAL_ERROR", 500)

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        code_map = {
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            429: "RATE_LIMIT_EXCEEDED",
        }
        return error_response(
            error.description or error.name,
            code_map.get(error.code, "INTERNAL_ERROR"),
            error.code,
        )

    @app.errorhandler(NoAuthorizationError)
    def handle_no_auth(error):
        return error_response("Authentication required.", "UNAUTHORIZED", 401)

    @app.errorhandler(InvalidHeaderError)
    def handle_invalid_header(error):
        return error_response("Invalid authorization header.", "VALIDATION_ERROR", 422)

    @app.errorhandler(JWTDecodeError)
    def handle_jwt_decode(error):
        return error_response("Invalid or expired token.", "UNAUTHORIZED", 401)

    @app.errorhandler(RevokedTokenError)
    def handle_revoked_token(error):
        return error_response("Token has been revoked.", "UNAUTHORIZED", 401)

    @app.errorhandler(FreshTokenRequired)
    def handle_fresh_token(error):
        return error_response("Fresh token required.", "UNAUTHORIZED", 401)
