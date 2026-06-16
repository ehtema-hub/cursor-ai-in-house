from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.extensions import db
from app.models.task import Task
from app.schemas.user_schema import (
    MessageSchema,
    TaskCreateSchema,
    TaskQuerySchema,
    TaskSchema,
    TaskUpdateSchema,
)
from app.services.notifications import (
    notify_task_assigned,
    notify_task_completed,
    notify_task_updated,
)
from app.services.permissions import is_project_member, require_project_member
from app.utils.auth_helpers import get_current_user

blp = Blueprint(
    "tasks",
    __name__,
    url_prefix="/api/tasks",
    description="Task CRUD operations",
)


def _apply_task_filters(query, args):
    if args.get("project_id"):
        query = query.filter_by(project_id=args["project_id"])
    if args.get("status"):
        query = query.filter_by(status=args["status"])
    if args.get("assignee_id"):
        query = query.filter_by(assignee_id=args["assignee_id"])
    if args.get("priority"):
        query = query.filter_by(priority=args["priority"])
    return query


@blp.route("/")
class TaskList(MethodView):
    @jwt_required()
    @blp.arguments(TaskQuerySchema, location="query")
    @blp.response(200, TaskSchema(many=True))
    def get(self, args):
        """List tasks with optional filters."""
        user = get_current_user()
        query = Task.query

        if args.get("project_id"):
            require_project_member(args["project_id"], user.id)
        else:
            from app.models.project import Project, ProjectMember

            member_ids = (
                db.session.query(ProjectMember.project_id)
                .filter_by(user_id=user.id)
                .subquery()
            )
            accessible = db.session.query(Project.id).filter(
                db.or_(Project.owner_id == user.id, Project.id.in_(member_ids))
            )
            query = query.filter(Task.project_id.in_(accessible))

        query = _apply_task_filters(query, args)
        return query.order_by(Task.created_at.desc()).all()

    @jwt_required()
    @blp.arguments(TaskCreateSchema)
    @blp.response(201, TaskSchema)
    def post(self, data):
        """Create a new task."""
        user = get_current_user()
        require_project_member(data["project_id"], user.id)

        if data.get("assignee_id") and not is_project_member(
            data["project_id"], data["assignee_id"]
        ):
            from app.models.project import Project

            project = Project.query.get(data["project_id"])
            if project.owner_id != data["assignee_id"]:
                blp.abort(400, message="Assignee must be a project member.")

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
        db.session.flush()

        if task.assignee_id and task.assignee_id != user.id:
            notify_task_assigned(task, user.name)

        db.session.commit()
        return task


@blp.route("/<int:task_id>")
class TaskDetail(MethodView):
    @jwt_required()
    @blp.response(200, TaskSchema)
    def get(self, task_id):
        """Get task details."""
        user = get_current_user()
        task = Task.query.get_or_404(task_id)
        require_project_member(task.project_id, user.id)
        return task

    @jwt_required()
    @blp.arguments(TaskUpdateSchema)
    @blp.response(200, TaskSchema)
    def put(self, data, task_id):
        """Update a task."""
        user = get_current_user()
        task = Task.query.get_or_404(task_id)
        require_project_member(task.project_id, user.id)

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
            if data["assignee_id"] and not is_project_member(
                task.project_id, data["assignee_id"]
            ):
                from app.models.project import Project

                project = Project.query.get(task.project_id)
                if project.owner_id != data["assignee_id"]:
                    blp.abort(400, message="Assignee must be a project member.")
            task.assignee_id = data["assignee_id"]
            changes.append("assignee changed")

        if changes:
            notify_task_updated(task, user.name, ", ".join(changes))

        if task.status == "done" and old_status != "done":
            notify_task_completed(task, user.name)

        if task.assignee_id and task.assignee_id != old_assignee and task.assignee_id != user.id:
            notify_task_assigned(task, user.name)

        db.session.commit()
        return task

    @jwt_required()
    @blp.response(200, MessageSchema)
    def delete(self, task_id):
        """Delete a task."""
        user = get_current_user()
        task = Task.query.get_or_404(task_id)
        require_project_member(task.project_id, user.id)

        db.session.delete(task)
        db.session.commit()
        return {"message": "Task deleted successfully."}
