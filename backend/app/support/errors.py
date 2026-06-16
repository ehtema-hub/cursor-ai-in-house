class SupportAPIError(Exception):
    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        errors: dict | None = None,
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.errors = errors or {}
        super().__init__(message)


def error_response(message: str, code: str, status_code: int, errors: dict | None = None):
    from flask import jsonify

    payload = {
        "status": "error",
        "message": message,
        "code": code,
    }
    if errors:
        payload["errors"] = errors
    return jsonify(payload), status_code
