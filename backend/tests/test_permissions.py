import pytest

from app.extensions import db
from app.models.project import ProjectMember
from app.services.permissions import (
    get_membership,
    get_project_or_404,
    get_user_projects_query,
    is_project_member,
    require_project_admin,
    require_project_member,
)


def test_membership_helpers(app, owner, member, project):
    db.session.add(ProjectMember(project_id=project.id, user_id=member.id, role="member"))
    db.session.commit()

    assert is_project_member(project.id, owner.id) is True
    assert is_project_member(project.id, member.id) is True
    assert get_membership(project.id, member.id).role == "member"
    assert get_project_or_404(project.id).id == project.id


def test_require_project_member_blocks_outsider(app, outsider, project):
    with pytest.raises(Exception):
        require_project_member(project.id, outsider.id)


def test_require_project_admin(app, owner, member, project):
    db.session.add(ProjectMember(project_id=project.id, user_id=member.id, role="member"))
    db.session.commit()
    require_project_admin(project.id, owner.id)

    with pytest.raises(Exception):
        require_project_admin(project.id, member.id)


def test_get_user_projects_query(app, owner, member, project):
    db.session.add(ProjectMember(project_id=project.id, user_id=member.id, role="member"))
    db.session.commit()
    owner_projects = get_user_projects_query(owner.id).all()
    member_projects = get_user_projects_query(member.id).all()
    assert any(p.id == project.id for p in owner_projects)
    assert any(p.id == project.id for p in member_projects)
