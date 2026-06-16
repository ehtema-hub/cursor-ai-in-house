from app.extensions import db
from app.models.mixins import TimestampMixin


class Project(db.Model, TimestampMixin):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    owner_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    owner = db.relationship("User", back_populates="owned_projects", foreign_keys=[owner_id])
    members = db.relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    tasks = db.relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Project {self.name}>"


class ProjectMember(db.Model, TimestampMixin):
    __tablename__ = "project_members"
    __table_args__ = (
        db.UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False, default="member")  # owner, admin, member

    project = db.relationship("Project", back_populates="members")
    user = db.relationship("User", back_populates="project_memberships")

    def __repr__(self) -> str:
        return f"<ProjectMember project={self.project_id} user={self.user_id}>"
