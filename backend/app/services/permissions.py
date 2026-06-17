from app.extensions import db
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.services.cache import cache, membership_cache_key
from app.tasks.background import invalidate_membership_cache


def get_project_or_404(project_id: int) -> Project:
    return Project.query.get_or_404(project_id)


def get_membership(project_id: int, user_id: int) -> ProjectMember | None:
    return ProjectMember.query.filter_by(
        project_id=project_id,
        user_id=user_id,
    ).first()


def is_project_member(project_id: int, user_id: int) -> bool:
    key = membership_cache_key(project_id, user_id)
    cached = cache.get(key)
    if cached is not None:
        return bool(cached)

    project = Project.query.get(project_id)
    if project is None:
        cache.set(key, False, timeout=120)
        return False
    if project.owner_id == user_id:
        cache.set(key, True, timeout=120)
        return True
    result = get_membership(project_id, user_id) is not None
    cache.set(key, result, timeout=120)
    return result


def require_project_member(project_id: int, user_id: int) -> ProjectMember | None:
    project = get_project_or_404(project_id)
    if project.owner_id == user_id:
        return None
    membership = get_membership(project_id, user_id)
    if membership is None:
        from flask_smorest import abort

        abort(403, message="You do not have access to this project.")
    return membership


def require_project_admin(project_id: int, user_id: int) -> None:
    project = get_project_or_404(project_id)
    if project.owner_id == user_id:
        return
    membership = get_membership(project_id, user_id)
    if membership is None or membership.role not in ("owner", "admin"):
        from flask_smorest import abort

        abort(403, message="Admin access required for this action.")


def get_user_projects_query(user_id: int):
    member_project_ids = db.session.query(ProjectMember.project_id).filter_by(
        user_id=user_id,
    )
    return Project.query.filter(
        db.or_(
            Project.owner_id == user_id,
            Project.id.in_(member_project_ids),
        )
    )


def add_project_owner_membership(project: Project) -> None:
    db.session.add(
        ProjectMember(
            project_id=project.id,
            user_id=project.owner_id,
            role="owner",
        )
    )


def find_user_by_email(email: str) -> User | None:
    return User.query.filter_by(email=email.lower().strip()).first()


def bust_membership_cache(project_id: int, user_id: int) -> None:
    cache.delete(membership_cache_key(project_id, user_id))
    invalidate_membership_cache.delay(project_id, user_id)
