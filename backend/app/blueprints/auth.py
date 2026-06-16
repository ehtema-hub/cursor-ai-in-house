from flask.views import MethodView
from flask_jwt_extended import create_access_token, create_refresh_token, jwt_required
from flask_smorest import Blueprint

from app.extensions import db
from app.models.user import User
from app.schemas.user_schema import (
    LoginSchema,
    MessageSchema,
    RegisterSchema,
    TokenSchema,
    UserSchema,
)
from app.utils.auth_helpers import get_current_user

blp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth",
    description="Authentication operations",
)


@blp.route("/register")
class Register(MethodView):
    @blp.arguments(RegisterSchema)
    @blp.response(201, UserSchema)
    def post(self, data):
        """Register a new user."""
        if User.query.filter_by(email=data["email"].lower()).first():
            blp.abort(409, message="An account with this email already exists.")

        user = User(
            name=data["name"].strip(),
            email=data["email"].lower().strip(),
        )
        user.set_password(data["password"])
        db.session.add(user)
        db.session.commit()
        return user


@blp.route("/login")
class Login(MethodView):
    @blp.arguments(LoginSchema)
    @blp.response(200, TokenSchema)
    def post(self, data):
        """Authenticate and receive JWT tokens."""
        user = User.query.filter_by(email=data["email"].lower()).first()

        if user is None or not user.check_password(data["password"]):
            blp.abort(401, message="Invalid email or password.")

        if not user.is_active:
            blp.abort(403, message="Account is disabled.")

        return {
            "access_token": create_access_token(identity=str(user.id)),
            "refresh_token": create_refresh_token(identity=str(user.id)),
        }


@blp.route("/refresh")
class RefreshToken(MethodView):
    @jwt_required(refresh=True)
    @blp.response(200, TokenSchema)
    def post(self):
        """Refresh the access token using a refresh token."""
        from flask_jwt_extended import get_jwt_identity

        user_id = get_jwt_identity()
        return {
            "access_token": create_access_token(identity=user_id),
            "refresh_token": create_refresh_token(identity=user_id),
        }


@blp.route("/logout")
class Logout(MethodView):
    @jwt_required()
    @blp.response(200, MessageSchema)
    def post(self):
        """Logout (client should discard tokens)."""
        return {"message": "Successfully logged out."}


@blp.route("/me")
class AuthMe(MethodView):
    @jwt_required()
    @blp.response(200, UserSchema)
    def get(self):
        """Get the currently authenticated user."""
        return get_current_user()
