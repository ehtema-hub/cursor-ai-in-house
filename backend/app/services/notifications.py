from app.extensions import db
from app.models.notification import Notification
from app.services.cache import cache, invalidate_unread_count, unread_count_cache_key
from app.tasks.background import process_notification_side_effects


def create_notification(
    *,
    user_id: int,
    type: str,
    title: str,
    message: str,
    related_project_id: int | None = None,
    related_task_id: int | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        related_project_id=related_project_id,
        related_task_id=related_task_id,
    )
    db.session.add(notification)
    db.session.flush()
    invalidate_unread_count(user_id)
    pending = db.session.info.setdefault("pending_notifications", [])
    pending.append((notification.id, user_id))
    return notification


def dispatch_pending_notifications() -> None:
    """Dispatch Celery jobs for notifications queued during the current transaction."""
    pending = db.session.info.pop("pending_notifications", [])
    for notification_id, user_id in pending:
        process_notification_side_effects.delay(notification_id, user_id)


def get_unread_count(user_id: int) -> int:
    key = unread_count_cache_key(user_id)
    cached = cache.get(key)
    if cached is not None:
        return int(cached)

    count = Notification.query.filter_by(user_id=user_id, is_read=False).count()
    cache.set(key, count, timeout=30)
    return count


def notify_task_assigned(task, assigner_name: str) -> None:
    if task.assignee_id is None:
        return
    create_notification(
        user_id=task.assignee_id,
        type="task_assigned",
        title="Task assigned to you",
        message=f'{assigner_name} assigned you "{task.title}".',
        related_project_id=task.project_id,
        related_task_id=task.id,
    )


def notify_task_updated(task, actor_name: str, change: str) -> None:
    recipients = {task.creator_id}
    if task.assignee_id:
        recipients.add(task.assignee_id)

    for user_id in recipients:
        create_notification(
            user_id=user_id,
            type="task_updated",
            title="Task updated",
            message=f'{actor_name} updated "{task.title}": {change}.',
            related_project_id=task.project_id,
            related_task_id=task.id,
        )


def notify_task_completed(task, actor_name: str) -> None:
    create_notification(
        user_id=task.creator_id,
        type="task_completed",
        title="Task completed",
        message=f'{actor_name} completed "{task.title}".',
        related_project_id=task.project_id,
        related_task_id=task.id,
    )


def notify_project_invite(user_id: int, project, inviter_name: str) -> None:
    create_notification(
        user_id=user_id,
        type="project_invite",
        title="Project invitation",
        message=f'{inviter_name} added you to project "{project.name}".',
        related_project_id=project.id,
    )
