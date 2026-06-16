from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint

from app.extensions import db
from app.models.project import Project, ProjectMember
from app.schemas.user_schema import (
    AddMemberSchema,
    MessageSchema,
    ProjectCreateSchema,
    ProjectMemberSchema,
    ProjectSchema,
    ProjectUpdateSchema,
)
from app.services.notifications import notify_project_invite
from app.services.permissions import (
    add_project_owner_membership,
    find_user_by_email,
    get_project_or_404,
    get_user_projects_query,
    require_project_admin,
    require_project_member,
)
from app.utils.auth_helpers import get_current_user

blp = Blueprint(
    "projects",
    __name__,
    url_prefix="/api/projects",
    description="Project management and team collaboration",
)


@blp.route("/")
class ProjectList(MethodView):
    @jwt_required()
    @blp.response(200, ProjectSchema(many=True))
    def get(self):
        """List projects the current user belongs to."""
        user = get_current_user()
        return get_user_projects_query(user.id).order_by(Project.created_at.desc()).all()

    @jwt_required()
    @blp.arguments(ProjectCreateSchema)
    @blp.response(201, ProjectSchema)
    def post(self, data):
        """Create a new project."""
        user = get_current_user()
        project = Project(
            name=data["name"].strip(),
            description=data.get("description", "").strip(),
            owner_id=user.id,
        )
        db.session.add(project)
        db.session.flush()
        add_project_owner_membership(project)
        db.session.commit()
        return project


@blp.route("/<int:project_id>")
class ProjectDetail(MethodView):
    @jwt_required()
    @blp.response(200, ProjectSchema)
    def get(self, project_id):
        """Get project details."""
        user = get_current_user()
        require_project_member(project_id, user.id)
        return get_project_or_404(project_id)

    @jwt_required()
    @blp.arguments(ProjectUpdateSchema)
    @blp.response(200, ProjectSchema)
    def put(self, data, project_id):
        """Update a project."""
        user = get_current_user()
        require_project_admin(project_id, user.id)
        project = get_project_or_404(project_id)

        if "name" in data:
            project.name = data["name"].strip()
        if "description" in data:
            project.description = data["description"].strip()

        db.session.commit()
        return project

    @jwt_required()
    @blp.response(200, MessageSchema)
    def delete(self, project_id):
        """Delete a project (owner only)."""
        user = get_current_user()
        project = get_project_or_404(project_id)

        if project.owner_id != user.id:
            blp.abort(403, message="Only the project owner can delete this project.")

        db.session.delete(project)
        db.session.commit()
        return {"message": "Project deleted successfully."}


@blp.route("/<int:project_id>/members")
class ProjectMembers(MethodView):
    @jwt_required()
    @blp.response(200, ProjectMemberSchema(many=True))
    def get(self, project_id):
        """List project team members."""
        user = get_current_user()
        require_project_member(project_id, user.id)
        return ProjectMember.query.filter_by(project_id=project_id).all()

    @jwt_required()
    @blp.arguments(AddMemberSchema)
    @blp.response(201, ProjectMemberSchema)
    def post(self, data, project_id):
        """Add a team member to the project."""
        user = get_current_user()
        require_project_admin(project_id, user.id)
        project = get_project_or_404(project_id)

        member_user = find_user_by_email(data["email"])
        if member_user is None:
            blp.abort(404, message="User with that email was not found.")

        existing = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=member_user.id,
        ).first()
        if existing:
            blp.abort(409, message="User is already a member of this project.")

        membership = ProjectMember(
            project_id=project_id,
            user_id=member_user.id,
            role=data["role"],
        )
        db.session.add(membership)
        notify_project_invite(member_user.id, project, user.name)
        db.session.commit()
        return membership


@blp.route("/<int:project_id>/members/<int:user_id>")
class ProjectMemberDetail(MethodView):
    @jwt_required()
    @blp.response(200, MessageSchema)
    def delete(self, project_id, user_id):
        """Remove a team member from the project."""
        current_user = get_current_user()
        require_project_admin(project_id, current_user.id)
        project = get_project_or_404(project_id)

        if user_id == project.owner_id:
            blp.abort(400, message="Cannot remove the project owner.")

        membership = ProjectMember.query.filter_by(
            project_id=project_id,
            user_id=user_id,
        ).first_or_404()

        db.session.delete(membership)
        db.session.commit()
        return {"message": "Member removed from project."}
