"""Celery background tasks for notifications, cache invalidation, and SLA scans."""

from __future__ import annotations

import json
import logging

from app.celery_app import celery
from app.extensions import db

logger = logging.getLogger(__name__)


@celery.task(name="tasks.process_notification_side_effects")
def process_notification_side_effects(notification_id: int, user_id: int) -> dict:
    """Invalidate caches and publish notification to Redis pub/sub."""
    from app.models.notification import Notification
    from app.services.cache import cache, invalidate_unread_count

    invalidate_unread_count(user_id)

    notification = db.session.get(Notification, notification_id)
    if notification is None:
        return {"status": "not_found"}

    publish_notification_event.delay(user_id, {
        "id": notification.id,
        "type": notification.type,
        "title": notification.title,
        "message": notification.message,
        "is_read": notification.is_read,
        "related_project_id": notification.related_project_id,
        "related_task_id": notification.related_task_id,
        "created_at": notification.created_at.isoformat(),
    })
    return {"status": "ok", "notification_id": notification_id}


@celery.task(name="tasks.publish_notification_event")
def publish_notification_event(user_id: int, payload: dict) -> dict:
    """Publish notification payload to Redis channel for SSE subscribers."""
    from app.services.cache import cache

    channel = f"notifications:{user_id}"
    redis_client = cache._redis
    if redis_client is not None:
        redis_client.publish(f"taskflow:{channel}", json.dumps(payload))
    else:
        cache.set(f"sse:pending:{user_id}:{payload['id']}", payload, timeout=300)
    return {"status": "published", "user_id": user_id}


@celery.task(name="tasks.invalidate_project_caches")
def invalidate_project_caches(project_id: int) -> dict:
    """Bump task-list cache versions for all project members."""
    from app.services.cache import bump_task_cache_version
    from app.models.project import Project, ProjectMember

    project = db.session.get(Project, project_id)
    if project is None:
        return {"status": "not_found"}

    user_ids = {project.owner_id}
    for member in ProjectMember.query.filter_by(project_id=project_id).all():
        user_ids.add(member.user_id)

    for user_id in user_ids:
        bump_task_cache_version(user_id)
    return {"status": "ok", "project_id": project_id, "users": len(user_ids)}


@celery.task(name="tasks.invalidate_membership_cache")
def invalidate_membership_cache(project_id: int, user_id: int) -> dict:
    from app.services.cache import cache, membership_cache_key

    cache.delete(membership_cache_key(project_id, user_id))
    return {"status": "ok"}


@celery.task(name="tasks.scan_sla_violations")
def scan_sla_violations() -> dict:
    """Scan support tickets approaching or missing SLA deadlines."""
    from datetime import datetime, timezone

    from app.models.user import User
    from app.support.models import SupportTicket
    from app.support.sla import is_sla_approaching, is_sla_missed
    from app.support import email_service as email

    now = datetime.now(timezone.utc)
    flagged = 0
    tickets = SupportTicket.query.filter(
        SupportTicket.status.notin_(("closed", "resolved"))
    ).all()

    admin_emails = [u.email for u in User.query.filter_by(role="admin", is_active=True).all()]

    for ticket in tickets:
        recipients = list(admin_emails)
        if ticket.assigned_to:
            recipients.append(ticket.assigned_to.email)

        if is_sla_missed(ticket.sla_response_due) and not ticket.sla_response_met:
            email.notify_sla_missed(ticket, "response", recipients)
            flagged += 1
        elif is_sla_approaching(ticket.sla_response_due):
            email.notify_sla_warning(ticket, "response", recipients)
            flagged += 1

        if is_sla_missed(ticket.sla_resolution_due) and not ticket.sla_resolution_met:
            email.notify_sla_missed(ticket, "resolution", recipients)
            flagged += 1
        elif is_sla_approaching(ticket.sla_resolution_due):
            email.notify_sla_warning(ticket, "resolution", recipients)
            flagged += 1

    logger.info("SLA scan complete at %s, flagged=%s", now.isoformat(), flagged)
    return {"status": "ok", "scanned": len(tickets), "flagged": flagged}
