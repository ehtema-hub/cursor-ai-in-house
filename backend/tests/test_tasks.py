def test_create_list_get_update_delete_task(client, owner_auth, project, owner):
    created = client.post(
        "/api/tasks/",
        json={
            "title": "Write tests",
            "description": "Add comprehensive pytest coverage for task API.",
            "project_id": project.id,
            "priority": "high",
            "status": "todo",
        },
        headers=owner_auth,
    )
    assert created.status_code == 201
    task_id = created.get_json()["id"]

    listing = client.get("/api/tasks/", headers=owner_auth)
    assert listing.status_code == 200
    assert any(t["id"] == task_id for t in listing.get_json())

    detail = client.get(f"/api/tasks/{task_id}", headers=owner_auth)
    assert detail.status_code == 200

    updated = client.put(
        f"/api/tasks/{task_id}",
        json={"status": "in_progress", "priority": "medium"},
        headers=owner_auth,
    )
    assert updated.status_code == 200
    assert updated.get_json()["status"] == "in_progress"

    deleted = client.delete(f"/api/tasks/{task_id}", headers=owner_auth)
    assert deleted.status_code == 200


def test_assign_task_notifies_assignee(client, owner_auth, member_auth, project, member):
    created = client.post(
        "/api/tasks/",
        json={
            "title": "Review PR",
            "description": "Please review the open pull request today.",
            "project_id": project.id,
            "assignee_id": member.id,
        },
        headers=owner_auth,
    )
    assert created.status_code == 201

    unread = client.get("/api/notifications/unread-count", headers=member_auth)
    assert unread.status_code == 200
    assert unread.get_json()["count"] >= 1


def test_filter_tasks_by_project(client, owner_auth, project):
    client.post(
        "/api/tasks/",
        json={
            "title": "Filtered task",
            "description": "This task should appear in project filter results.",
            "project_id": project.id,
        },
        headers=owner_auth,
    )
    response = client.get(f"/api/tasks/?project_id={project.id}", headers=owner_auth)
    assert response.status_code == 200
    assert len(response.get_json()) >= 1


def test_outsider_cannot_create_task(client, outsider_auth, project):
    response = client.post(
        "/api/tasks/",
        json={
            "title": "Blocked",
            "description": "Outsider should not create tasks in this project.",
            "project_id": project.id,
        },
        headers=outsider_auth,
    )
    assert response.status_code == 403


def test_complete_task_notifies_creator(client, owner_auth, member_auth, project, member):
    db_add_member(client, owner_auth, project, member)
    created = client.post(
        "/api/tasks/",
        json={
            "title": "Finish docs",
            "description": "Complete the API documentation for task endpoints.",
            "project_id": project.id,
            "assignee_id": member.id,
        },
        headers=owner_auth,
    )
    task_id = created.get_json()["id"]

    client.put(
        f"/api/tasks/{task_id}",
        json={"status": "done"},
        headers=member_auth,
    )
    unread = client.get("/api/notifications/unread-count", headers=owner_auth)
    assert unread.get_json()["count"] >= 1


def db_add_member(client, owner_auth, project, member):
    from app.extensions import db
    from app.models.project import ProjectMember

    existing = ProjectMember.query.filter_by(project_id=project.id, user_id=member.id).first()
    if existing is None:
        db.session.add(ProjectMember(project_id=project.id, user_id=member.id, role="member"))
        db.session.commit()
