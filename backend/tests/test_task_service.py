from app.extensions import db
from app.models.task import Task
from app.services.cache import cache, task_list_cache_key
from app.services.permissions import is_project_member
from app.services.task_service import apply_task_filters, create_task, list_tasks_for_user, update_task


def test_list_tasks_uses_cache(app, owner, project):
    task = Task(
        title="Cached",
        description="Task list should be cached by id list.",
        project_id=project.id,
        creator_id=owner.id,
    )
    db.session.add(task)
    db.session.commit()

    args = {"project_id": project.id}
    first = list_tasks_for_user(owner.id, args)
    key = task_list_cache_key(owner.id, args)
    assert cache.get(key) == [task.id]

    task.title = "Changed"
    db.session.commit()

    second = list_tasks_for_user(owner.id, args)
    assert len(second) == 1
    assert second[0].title == first[0].title


def test_create_and_update_task_service(app, owner, project):
    data = {
        "title": "Service task",
        "description": "Created via task service layer directly.",
        "project_id": project.id,
        "status": "todo",
    }
    task = create_task(owner, data)
    db.session.commit()
    assert task.id is not None

    changes, old_status, old_assignee = update_task(task, {"status": "in_progress"})
    db.session.commit()
    assert "status changed to in_progress" in changes[0]
    assert old_status == "todo"
    assert old_assignee is None


def test_apply_task_filters(app, owner, project):
    todo = Task(title="Todo", description="Todo item", project_id=project.id, creator_id=owner.id, status="todo")
    done = Task(title="Done", description="Done item", project_id=project.id, creator_id=owner.id, status="done")
    db.session.add_all([todo, done])
    db.session.commit()

    query = apply_task_filters(Task.query.filter_by(project_id=project.id), {"status": "todo"})
    results = query.all()
    assert len(results) == 1
    assert results[0].status == "todo"


def test_is_project_member_cache(app, owner, project):
    assert is_project_member(project.id, owner.id) is True
    key = f"member:{project.id}:{owner.id}"
    assert cache.get(key) is True
