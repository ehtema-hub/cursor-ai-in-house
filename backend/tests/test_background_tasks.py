from app.extensions import db
from app.models.notification import Notification
from app.services.notifications import create_notification, dispatch_pending_notifications
from app.tasks.background import (
    invalidate_membership_cache,
    invalidate_project_caches,
    process_notification_side_effects,
    publish_notification_event,
    scan_sla_violations,
)


def test_process_notification_side_effects(app, owner):
    notification = create_notification(
        user_id=owner.id,
        type="system",
        title="Background",
        message="Processed async",
    )
    db.session.commit()
    result = process_notification_side_effects(notification.id, owner.id)
    assert result["status"] == "ok"


def test_publish_notification_event(app, owner):
    result = publish_notification_event(
        owner.id,
        {"id": 1, "type": "system", "title": "T", "message": "M", "is_read": False, "created_at": "2026-01-01T00:00:00"},
    )
    assert result["status"] == "published"


def test_invalidate_project_caches(app, owner, project):
    result = invalidate_project_caches(project.id)
    assert result["status"] == "ok"
    assert result["users"] >= 1


def test_invalidate_membership_cache(app, owner, project):
    result = invalidate_membership_cache(project.id, owner.id)
    assert result["status"] == "ok"


def test_dispatch_pending_notifications(app, owner):
    create_notification(
        user_id=owner.id,
        type="system",
        title="Queued",
        message="Pending dispatch",
    )
    db.session.commit()
    dispatch_pending_notifications()


def test_scan_sla_violations_empty(app):
    result = scan_sla_violations()
    assert result["status"] == "ok"
    assert result["scanned"] == 0
