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
    dispatch_pending_notifications,
    notify_task_assigned,
    notify_task_completed,
    notify_task_updated,
)
from app.services.permissions import require_project_member
from app.services.task_service import create_task, list_tasks_for_user, update_task
from app.tasks.background import invalidate_project_caches
from app.utils.auth_helpers import get_current_user

blp = Blueprint(
    "tasks",
    __name__,
    url_prefix="/api/tasks",
    description="Task CRUD operations",
)


@blp.route("/")
class TaskList(MethodView):
    @jwt_required()
    @blp.arguments(TaskQuerySchema, location="query")
    @blp.response(200, TaskSchema(many=True))
    def get(self, args):
        """List tasks with optional filters."""
        user = get_current_user()
        return list_tasks_for_user(user.id, args)

    @jwt_required()
    @blp.arguments(TaskCreateSchema)
    @blp.response(201, TaskSchema)
    def post(self, data):
        """Create a new task."""
        user = get_current_user()
        task = create_task(user, data)
        db.session.flush()

        if task.assignee_id and task.assignee_id != user.id:
            notify_task_assigned(task, user.name)

        db.session.commit()
        dispatch_pending_notifications()
        invalidate_project_caches.delay(task.project_id)
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

        changes, old_status, old_assignee = update_task(task, data)

        if changes:
            notify_task_updated(task, user.name, ", ".join(changes))

        if task.status == "done" and old_status != "done":
            notify_task_completed(task, user.name)

        if task.assignee_id and task.assignee_id != old_assignee and task.assignee_id != user.id:
            notify_task_assigned(task, user.name)

        db.session.commit()
        dispatch_pending_notifications()
        invalidate_project_caches.delay(task.project_id)
        return task

    @jwt_required()
    @blp.response(200, MessageSchema)
    def delete(self, task_id):
        """Delete a task."""
        user = get_current_user()
        task = Task.query.get_or_404(task_id)
        require_project_member(task.project_id, user.id)
        project_id = task.project_id

        db.session.delete(task)
        db.session.commit()
        invalidate_project_caches.delay(project_id)
        return {"message": "Task deleted successfully."}
