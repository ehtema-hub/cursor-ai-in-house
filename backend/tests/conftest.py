import pytest

from app.extensions import db
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.services.cache import cache


@pytest.fixture
def app():
    from app import create_app

    application = create_app("testing")
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def reset_cache(app):
    cache._memory.clear()
    cache._redis = None
    yield
    cache._memory.clear()


@pytest.fixture
def owner(app):
    user = User(name="Project Owner", email="owner@test.local", role="customer")
    user.set_password("OwnerPass123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def member(app):
    user = User(name="Team Member", email="member@test.local", role="customer")
    user.set_password("MemberPass123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def outsider(app):
    user = User(name="Outsider", email="outsider@test.local", role="customer")
    user.set_password("OutsiderPass123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def project(app, owner):
    project = Project(name="Test Project", description="Demo project", owner_id=owner.id)
    db.session.add(project)
    db.session.flush()
    db.session.add(
        ProjectMember(project_id=project.id, user_id=owner.id, role="owner")
    )
    db.session.commit()
    return project


@pytest.fixture
def member_auth(client, member, project):
    db.session.add(
        ProjectMember(project_id=project.id, user_id=member.id, role="member")
    )
    db.session.commit()
    response = client.post(
        "/api/auth/login",
        json={"email": member.email, "password": "MemberPass123!"},
    )
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def owner_auth(client, owner):
    response = client.post(
        "/api/auth/login",
        json={"email": owner.email, "password": "OwnerPass123!"},
    )
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def outsider_auth(client, outsider):
    response = client.post(
        "/api/auth/login",
        json={"email": outsider.email, "password": "OutsiderPass123!"},
    )
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def auth_headers(client, email, password):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.get_json()['access_token']}"}


@pytest.fixture
def support_users(app):
    from app.support.seed import seed_support_users

    with app.app_context():
        seed_support_users()
