def test_create_and_list_projects(client, owner_auth, owner):
    create = client.post(
        "/api/projects/",
        json={"name": "Alpha", "description": "First project"},
        headers=owner_auth,
    )
    assert create.status_code == 201
    project_id = create.get_json()["id"]

    listing = client.get("/api/projects/", headers=owner_auth)
    assert listing.status_code == 200
    assert any(p["id"] == project_id for p in listing.get_json())


def test_get_update_delete_project(client, owner_auth, project):
    detail = client.get(f"/api/projects/{project.id}", headers=owner_auth)
    assert detail.status_code == 200

    updated = client.put(
        f"/api/projects/{project.id}",
        json={"name": "Renamed Project"},
        headers=owner_auth,
    )
    assert updated.status_code == 200
    assert updated.get_json()["name"] == "Renamed Project"

    deleted = client.delete(f"/api/projects/{project.id}", headers=owner_auth)
    assert deleted.status_code == 200


def test_outsider_cannot_access_project(client, outsider_auth, project):
    response = client.get(f"/api/projects/{project.id}", headers=outsider_auth)
    assert response.status_code == 403


def test_add_and_remove_member(client, owner_auth, member, project):
    added = client.post(
        f"/api/projects/{project.id}/members",
        json={"email": member.email, "role": "member"},
        headers=owner_auth,
    )
    assert added.status_code == 201

    members = client.get(f"/api/projects/{project.id}/members", headers=owner_auth)
    assert members.status_code == 200
    assert len(members.get_json()) >= 2

    removed = client.delete(
        f"/api/projects/{project.id}/members/{member.id}",
        headers=owner_auth,
    )
    assert removed.status_code == 200


def test_add_unknown_member_email(client, owner_auth, project):
    response = client.post(
        f"/api/projects/{project.id}/members",
        json={"email": "missing@test.local", "role": "member"},
        headers=owner_auth,
    )
    assert response.status_code == 404


def test_non_admin_cannot_add_member(client, member_auth, outsider, project):
    response = client.post(
        f"/api/projects/{project.id}/members",
        json={"email": outsider.email, "role": "member"},
        headers=member_auth,
    )
    assert response.status_code == 403
