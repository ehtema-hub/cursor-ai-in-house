from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.models.user import User
from app.schemas.user_schema import UserSchema
from app.utils.auth_helpers import get_current_user

blp = Blueprint(
    "users",
    __name__,
    url_prefix="/api/users",
    description="User management",
)


@blp.route("/me")
class CurrentUser(MethodView):
    @jwt_required()
    @blp.response(200, UserSchema)
    def get(self):
        """Get the currently authenticated user."""
        return get_current_user()


@blp.route("/")
class UserList(MethodView):
    @jwt_required()
    @blp.response(200, UserSchema(many=True))
    def get(self):
        """List all users (protected)."""
        return User.query.order_by(User.created_at.desc()).all()
