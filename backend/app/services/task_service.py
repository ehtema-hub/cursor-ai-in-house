"""Task query and mutation service with Redis-backed list caching."""

from __future__ import annotations

from app.extensions import db
from app.models.project import Project, ProjectMember
from app.models.task import Task
from app.services.cache import cache, task_list_cache_key
from app.services.permissions import is_project_member, require_project_member


def apply_task_filters(query, args: dict):
    if args.get("project_id"):
        query = query.filter_by(project_id=args["project_id"])
    if args.get("status"):
        query = query.filter_by(status=args["status"])
    if args.get("assignee_id"):
        query = query.filter_by(assignee_id=args["assignee_id"])
    if args.get("priority"):
        query = query.filter_by(priority=args["priority"])
    return query


def _build_accessible_tasks_query(user_id: int, args: dict):
    query = Task.query
    if args.get("project_id"):
        require_project_member(args["project_id"], user_id)
        query = query.filter_by(project_id=args["project_id"])
    else:
        member_ids = (
            db.session.query(ProjectMember.project_id)
            .filter_by(user_id=user_id)
            .subquery()
        )
        accessible = db.session.query(Project.id).filter(
            db.or_(Project.owner_id == user_id, Project.id.in_(member_ids))
        )
        query = query.filter(Task.project_id.in_(accessible))

    return apply_task_filters(query, args).order_by(Task.created_at.desc())


def list_tasks_for_user(user_id: int, args: dict) -> list[Task]:
    """Return tasks for a user, using Redis cache of task IDs when available."""
    key = task_list_cache_key(user_id, args)
    cached_ids = cache.get(key)
    if cached_ids is not None:
        if not cached_ids:
            return []
        return (
            Task.query.filter(Task.id.in_(cached_ids))
            .order_by(Task.created_at.desc())
            .all()
        )

    tasks = _build_accessible_tasks_query(user_id, args).all()
    cache.set(key, [task.id for task in tasks], timeout=60)
    return tasks


def create_task(user, data: dict) -> Task:
    require_project_member(data["project_id"], user.id)

    if data.get("assignee_id") and not is_project_member(
        data["project_id"], data["assignee_id"]
    ):
        project = Project.query.get(data["project_id"])
        if project is None or project.owner_id != data["assignee_id"]:
            from flask_smorest import abort

            abort(400, message="Assignee must be a project member.")

    task = Task(
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        status=data.get("status", "todo"),
        priority=data.get("priority", "medium"),
        due_date=data.get("due_date"),
        project_id=data["project_id"],
        assignee_id=data.get("assignee_id"),
        creator_id=user.id,
    )
    db.session.add(task)
    return task


def update_task(task: Task, data: dict) -> tuple[list[str], str | None, int | None]:
    """Apply updates and return (changes, old_status, old_assignee_id)."""
    old_status = task.status
    old_assignee = task.assignee_id
    changes = []

    if "title" in data:
        task.title = data["title"].strip()
        changes.append("title updated")
    if "description" in data:
        task.description = data["description"].strip()
        changes.append("description updated")
    if "status" in data:
        task.status = data["status"]
        changes.append(f"status changed to {data['status']}")
    if "priority" in data:
        task.priority = data["priority"]
        changes.append(f"priority changed to {data['priority']}")
    if "due_date" in data:
        task.due_date = data["due_date"]
        changes.append("due date updated")
    if "assignee_id" in data:
        if data["assignee_id"] and not is_project_member(task.project_id, data["assignee_id"]):
            project = Project.query.get(task.project_id)
            if project is None or project.owner_id != data["assignee_id"]:
                from flask_smorest import abort

                abort(400, message="Assignee must be a project member.")
        task.assignee_id = data["assignee_id"]
        changes.append("assignee changed")

    return changes, old_status, old_assignee
