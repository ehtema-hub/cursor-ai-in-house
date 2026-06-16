from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.models.user import User


def get_current_user() -> User:
    user_id = int(get_jwt_identity())
    return User.query.get_or_404(user_id)


def get_current_user_id() -> int:
    return int(get_jwt_identity())
