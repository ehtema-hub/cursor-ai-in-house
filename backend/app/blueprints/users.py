from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.extensions import db
from app.models.user import User
from app.schemas.commerce_schema import UpdateSelfUserSchema
from app.schemas.user_schema import UserSchema
from app.support.errors import SupportAPIError
from app.support.models import NotificationPreference, SupportNotification
from app.support.rbac import get_current_user_required
from app.support.schemas import NotificationPreferenceSchema, SupportNotificationSchema, SupportUserSchema, UpdateSupportUserSchema
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

    @jwt_required()
    @blp.arguments(UpdateSelfUserSchema)
    @blp.response(200, UserSchema)
    def put(self, data):
        """Update current user profile."""
        user = get_current_user()
        if "name" in data and data["name"]:
            user.name = data["name"].strip()
        if "email" in data and data["email"]:
            email = data["email"].lower().strip()
            existing = User.query.filter(User.email == email, User.id != user.id).first()
            if existing:
                raise SupportAPIError(
                    "Email already in use.",
                    "CONFLICT",
                    409,
                    {"email": ["An account with this email already exists."]},
                )
            user.email = email
        db.session.commit()
        return user

    @jwt_required()
    @blp.response(204)
    def delete(self):
        """Deactivate current user account."""
        user = get_current_user()
        user.is_active = False
        db.session.commit()
        return ""


@blp.route("/")
class UserList(MethodView):
    @jwt_required()
    @blp.response(200, SupportUserSchema(many=True))
    def get(self):
        """List all users (admin only)."""
        user = get_current_user_required()
        if not user.is_admin:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        return User.query.order_by(User.created_at.desc()).all()


@blp.route("/<int:user_id>")
class UserDetail(MethodView):
    @jwt_required()
    @blp.response(200, SupportUserSchema)
    def get(self, user_id):
        """Get user details."""
        current = get_current_user_required()
        if not current.is_admin and current.id != user_id:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        target = User.query.get(user_id)
        if target is None:
            raise SupportAPIError("User not found.", "NOT_FOUND", 404)
        return target

    @jwt_required()
    @blp.arguments(UpdateSupportUserSchema)
    @blp.response(200, SupportUserSchema)
    def put(self, data, user_id):
        """Update user (admin only)."""
        current = get_current_user_required()
        if not current.is_admin:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        target = User.query.get(user_id)
        if target is None:
            raise SupportAPIError("User not found.", "NOT_FOUND", 404)

        if "name" in data and data["name"]:
            target.name = data["name"].strip()
        if "role" in data and data["role"]:
            target.role = data["role"]
        if "availability_status" in data and data["availability_status"]:
            target.availability_status = data["availability_status"]
        if "expertise_areas" in data and data["expertise_areas"] is not None:
            target.expertise_areas = data["expertise_areas"]
        if "is_active" in data and data["is_active"] is not None:
            target.is_active = data["is_active"]

        db.session.commit()
        return target


@blp.route("/me/notifications")
class SupportNotifications(MethodView):
    @jwt_required()
    @blp.response(200, SupportNotificationSchema(many=True))
    def get(self):
        """In-app support notifications for staff."""
        user = get_current_user_required()
        if not user.is_staff:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        return (
            SupportNotification.query.filter_by(user_id=user.id)
            .order_by(SupportNotification.created_at.desc())
            .limit(50)
            .all()
        )


@blp.route("/me/notification-preferences")
class NotificationPreferences(MethodView):
    @jwt_required()
    @blp.response(200, NotificationPreferenceSchema)
    def get(self):
        """Get notification preferences."""
        user = get_current_user_required()
        prefs = user.notification_preferences
        if prefs is None:
            prefs = NotificationPreference(user_id=user.id)
            db.session.add(prefs)
            db.session.commit()
        return prefs

    @jwt_required()
    @blp.arguments(NotificationPreferenceSchema)
    @blp.response(200, NotificationPreferenceSchema)
    def put(self, data):
        """Update notification preferences."""
        user = get_current_user_required()
        prefs = user.notification_preferences
        if prefs is None:
            prefs = NotificationPreference(user_id=user.id)
            db.session.add(prefs)
        for key in (
            "email_ticket_created",
            "email_ticket_assigned",
            "email_status_changed",
            "email_new_comment",
            "email_sla_warning",
            "in_app_enabled",
        ):
            if key in data and data[key] is not None:
                setattr(prefs, key, data[key])
        db.session.commit()
        return prefs
