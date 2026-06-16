import re
from functools import wraps

import bleach
from flask import request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models.user import User
from app.support.errors import SupportAPIError


ALLOWED_TAGS: list[str] = []
ALLOWED_ATTRIBUTES: dict = {}


def sanitize_text(value: str) -> str:
    if not value:
        return value
    cleaned = bleach.clean(value, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES, strip=True)
    return cleaned.strip()


def sanitize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    return sanitize_text(value)


EMAIL_PATTERN = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?"
    r"(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)


def validate_email_format(email: str) -> bool:
    if not email or len(email) > 254:
        return False
    return bool(EMAIL_PATTERN.match(email))


def get_current_user_optional() -> User | None:
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
        if user_id is None:
            return None
        return User.query.get(int(user_id))
    except Exception:
        return None


def get_current_user_required() -> User:
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    if user_id is None:
        raise SupportAPIError("Authentication required.", "UNAUTHORIZED", 401)
    user = User.query.get(int(user_id))
    if user is None or not user.is_active:
        raise SupportAPIError("Authentication required.", "UNAUTHORIZED", 401)
    return user


def roles_required(*roles: str):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user = get_current_user_required()
            if user.role not in roles:
                raise SupportAPIError(
                    "Insufficient permissions for this action.",
                    "FORBIDDEN",
                    403,
                )
            return fn(*args, **kwargs, current_user=user)

        return wrapper

    return decorator


def staff_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = get_current_user_required()
        if not user.is_staff:
            raise SupportAPIError(
                "Insufficient permissions for this action.",
                "FORBIDDEN",
                403,
            )
        return fn(*args, **kwargs, current_user=user)

    return wrapper


def admin_required(fn):
    return roles_required("admin")(fn)
