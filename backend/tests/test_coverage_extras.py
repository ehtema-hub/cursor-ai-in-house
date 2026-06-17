from unittest.mock import MagicMock, patch

import pytest

from app.extensions import db
from app.models.task import Task
from app.services.cache import CacheService, cache
from app.services.notifications import notify_task_assigned, notify_task_completed, notify_task_updated
from app.services.permissions import is_project_member
from app.services.task_service import create_task, list_tasks_for_user
from app.tasks.background import process_notification_side_effects, scan_sla_violations


def test_auth_refresh_token(client, owner_auth, owner):
    login = client.post(
        "/api/auth/login",
        json={"email": owner.email, "password": "OwnerPass123!"},
    )
    refresh = login.get_json()["refresh_token"]
    response = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {refresh}"},
    )
    assert response.status_code == 200
    assert "access_token" in response.get_json()


def test_disabled_account_cannot_login(client, app, owner):
    owner.is_active = False
    db.session.commit()
    response = client.post(
        "/api/auth/login",
        json={"email": owner.email, "password": "OwnerPass123!"},
    )
    assert response.status_code == 403


def test_duplicate_project_member(client, owner_auth, member, project):
    first = client.post(
        f"/api/projects/{project.id}/members",
        json={"email": member.email, "role": "member"},
        headers=owner_auth,
    )
    assert first.status_code == 201
    second = client.post(
        f"/api/projects/{project.id}/members",
        json={"email": member.email, "role": "member"},
        headers=owner_auth,
    )
    assert second.status_code == 409


def test_only_owner_can_delete_project(client, member_auth, project):
    response = client.delete(f"/api/projects/{project.id}", headers=member_auth)
    assert response.status_code == 403


def test_cannot_remove_project_owner(client, owner_auth, project, owner):
    response = client.delete(
        f"/api/projects/{project.id}/members/{owner.id}",
        headers=owner_auth,
    )
    assert response.status_code == 400


def test_invalid_assignee_rejected(client, owner_auth, outsider, project):
    response = client.post(
        "/api/tasks/",
        json={
            "title": "Invalid assignee",
            "description": "Assignee must belong to the project team.",
            "project_id": project.id,
            "assignee_id": outsider.id,
        },
        headers=owner_auth,
    )
    assert response.status_code == 400


def test_list_tasks_without_project_filter(client, owner_auth, project):
    client.post(
        "/api/tasks/",
        json={
            "title": "Scoped list",
            "description": "Should appear when listing all accessible tasks.",
            "project_id": project.id,
        },
        headers=owner_auth,
    )
    response = client.get("/api/tasks/", headers=owner_auth)
    assert response.status_code == 200
    assert len(response.get_json()) >= 1


def test_task_filters(client, owner_auth, project, owner):
    client.post(
        "/api/tasks/",
        json={
            "title": "High priority todo",
            "description": "Filter by status and priority fields.",
            "project_id": project.id,
            "priority": "high",
            "status": "todo",
            "assignee_id": owner.id,
        },
        headers=owner_auth,
    )
    response = client.get(
        f"/api/tasks/?project_id={project.id}&status=todo&priority=high&assignee_id={owner.id}",
        headers=owner_auth,
    )
    assert response.status_code == 200
    assert len(response.get_json()) >= 1


def test_is_project_member_missing_project(app):
    assert is_project_member(9999, 1) is False


def test_notify_helpers_skip_or_send(app, owner, project):
    task = Task(
        title="Notify",
        description="Notification helper coverage task item.",
        project_id=project.id,
        creator_id=owner.id,
        assignee_id=owner.id,
    )
    db.session.add(task)
    db.session.commit()

    notify_task_assigned(task, "Actor")
    notify_task_updated(task, "Actor", "updated")
    notify_task_completed(task, "Actor")
    notify_task_assigned(Task(title="X", description="No assignee task", project_id=project.id, creator_id=owner.id), "A")


def test_process_notification_not_found(app):
    result = process_notification_side_effects(99999, 1)
    assert result["status"] == "not_found"


def test_cache_redis_get_set_delete():
    service = CacheService()
    mock_redis = MagicMock()
    mock_redis.get.return_value = '"value"'
    service._redis = mock_redis
    assert service.get("key") == "value"
    service.set("key", {"a": 1}, timeout=10)
    mock_redis.setex.assert_called_once()
    service.delete("key")
    mock_redis.delete.assert_called_once()


def test_cache_redis_delete_pattern():
    service = CacheService()
    mock_redis = MagicMock()
    mock_redis.scan_iter.return_value = ["taskflow:tasks:1", "taskflow:tasks:2"]
    service._redis = mock_redis
    assert service.delete_pattern("tasks:*") == 2


def test_cache_init_app_uses_redis(app):
    service = CacheService()
    with patch("redis.from_url") as mock_from_url:
        mock_client = MagicMock()
        mock_from_url.return_value = mock_client
        app.config["TESTING"] = False
        app.config["REDIS_URL"] = "redis://localhost:6379/1"
        service.init_app(app)
        assert service._redis is mock_client


def test_list_tasks_empty_cache(app, owner, project):
    args = {"project_id": project.id}
    tasks = list_tasks_for_user(owner.id, args)
    assert tasks == []


def test_update_project_description(client, owner_auth, project):
    response = client.put(
        f"/api/projects/{project.id}",
        json={"description": "Updated description text"},
        headers=owner_auth,
    )
    assert response.status_code == 200
    assert response.get_json()["description"] == "Updated description text"


def test_update_task_description_only(client, owner_auth, project):
    created = client.post(
        "/api/tasks/",
        json={
            "title": "Update me",
            "description": "Original task description content here.",
            "project_id": project.id,
        },
        headers=owner_auth,
    )
    task_id = created.get_json()["id"]
    response = client.put(
        f"/api/tasks/{task_id}",
        json={"description": "Updated task description content here."},
        headers=owner_auth,
    )
    assert response.status_code == 200


def test_scan_sla_with_open_ticket(app, support_users):
    from datetime import datetime, timedelta, timezone

    from app.support.models import SupportTicket

    ticket = SupportTicket(
        ticket_number="TICK-TEST-0001",
        subject="SLA scan test ticket",
        description="Testing SLA background scan for performance coverage.",
        status="open",
        priority="urgent",
        category="technical",
        customer_email="customer@support.local",
        sla_response_due=datetime.now(timezone.utc) - timedelta(hours=1),
        sla_resolution_due=datetime.now(timezone.utc) + timedelta(hours=1),
    )
    db.session.add(ticket)
    db.session.commit()
    result = scan_sla_violations()
    assert result["scanned"] >= 1


def test_invalidate_project_task_caches_helper(app, owner, project):
    from app.services.cache import bump_task_cache_version, invalidate_project_task_caches

    bump_task_cache_version(owner.id)
    invalidate_project_task_caches(project.id)

