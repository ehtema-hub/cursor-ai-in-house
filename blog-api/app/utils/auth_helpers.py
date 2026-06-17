from flask import abort, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.extensions import db
from app.models import User


def get_current_user() -> User:
    """Return the authenticated user from flask.g or load from JWT."""
    if getattr(g, "current_user", None) is not None:
        return g.current_user

    verify_jwt_in_request()
    user_id = int(get_jwt_identity())
    user = db.session.get(User, user_id)
    if user is None:
        abort(401, description="Invalid token user.")
    g.current_user = user
    return user
