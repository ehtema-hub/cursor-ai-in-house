import json
import time

from flask import Response, stream_with_context
from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.extensions import db
from app.models.notification import Notification
from app.schemas.notification_schema import (
    NotificationQuerySchema,
    NotificationSchema,
    UnreadCountSchema,
)
from app.schemas.user_schema import MessageSchema
from app.services.cache import cache, invalidate_unread_count
from app.services.notifications import get_unread_count
from app.utils.auth_helpers import get_current_user_id

blp = Blueprint(
    "notifications",
    __name__,
    url_prefix="/api/notifications",
    description="Real-time notifications",
)


@blp.route("/")
class NotificationList(MethodView):
    @jwt_required()
    @blp.arguments(NotificationQuerySchema, location="query")
    @blp.response(200, NotificationSchema(many=True))
    def get(self, args):
        """List notifications for the current user."""
        user_id = get_current_user_id()
        query = Notification.query.filter_by(user_id=user_id)

        if args.get("unread_only"):
            query = query.filter_by(is_read=False)

        return query.order_by(Notification.created_at.desc()).limit(50).all()


@blp.route("/unread-count")
class UnreadCount(MethodView):
    @jwt_required()
    @blp.response(200, UnreadCountSchema)
    def get(self):
        """Get count of unread notifications (Redis-cached)."""
        user_id = get_current_user_id()
        return {"count": get_unread_count(user_id)}


@blp.route("/<int:notification_id>/read")
class MarkNotificationRead(MethodView):
    @jwt_required()
    @blp.response(200, NotificationSchema)
    def put(self, notification_id):
        """Mark a notification as read."""
        user_id = get_current_user_id()
        notification = Notification.query.filter_by(
            id=notification_id,
            user_id=user_id,
        ).first_or_404()
        notification.is_read = True
        db.session.commit()
        invalidate_unread_count(user_id)
        return notification


@blp.route("/read-all")
class MarkAllRead(MethodView):
    @jwt_required()
    @blp.response(200, MessageSchema)
    def put(self):
        """Mark all notifications as read."""
        user_id = get_current_user_id()
        Notification.query.filter_by(user_id=user_id, is_read=False).update(
            {"is_read": True}
        )
        db.session.commit()
        invalidate_unread_count(user_id)
        return {"message": "All notifications marked as read."}


@blp.route("/stream")
class NotificationStream(MethodView):
    @jwt_required()
    def get(self):
        """Real-time notification stream via Server-Sent Events (SSE)."""
        user_id = get_current_user_id()
        last_id = 0
        redis_client = cache._redis
        pubsub = redis_client.pubsub() if redis_client is not None else None
        if pubsub is not None:
            pubsub.subscribe(f"taskflow:notifications:{user_id}")

        def event_stream():
            nonlocal last_id
            yield ": connected\n\n"
            while True:
                if pubsub is not None:
                    message = pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if message and message.get("data"):
                        payload = json.loads(message["data"])
                        last_id = max(last_id, payload.get("id", last_id))
                        yield f"data: {json.dumps(payload)}\n\n"
                        continue

                new_notifications = (
                    Notification.query.filter(
                        Notification.user_id == user_id,
                        Notification.id > last_id,
                    )
                    .order_by(Notification.id.asc())
                    .limit(10)
                    .all()
                )

                for notification in new_notifications:
                    last_id = notification.id
                    payload = {
                        "id": notification.id,
                        "type": notification.type,
                        "title": notification.title,
                        "message": notification.message,
                        "is_read": notification.is_read,
                        "related_project_id": notification.related_project_id,
                        "related_task_id": notification.related_task_id,
                        "created_at": notification.created_at.isoformat(),
                    }
                    yield f"data: {json.dumps(payload)}\n\n"

                time.sleep(2 if pubsub is None else 0.5)

        return Response(
            stream_with_context(event_stream()),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
            },
        )
