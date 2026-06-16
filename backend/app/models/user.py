import json
from datetime import datetime, timezone

from werkzeug.security import check_password_hash as werkzeug_check_password

from app.extensions import db
from app.utils.passwords import hash_password, verify_password


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="customer", index=True)
    availability_status = db.Column(db.String(20), nullable=False, default="available")
    expertise_areas = db.Column(db.JSON, default=list)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    owned_projects = db.relationship(
        "Project",
        back_populates="owner",
        foreign_keys="Project.owner_id",
        lazy="dynamic",
    )
    project_memberships = db.relationship(
        "ProjectMember",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    assigned_tasks = db.relationship(
        "Task",
        back_populates="assignee",
        foreign_keys="Task.assignee_id",
        lazy="dynamic",
    )
    notifications = db.relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    support_tickets = db.relationship(
        "SupportTicket",
        back_populates="customer",
        foreign_keys="SupportTicket.customer_id",
        lazy="dynamic",
    )
    assigned_support_tickets = db.relationship(
        "SupportTicket",
        back_populates="assigned_to",
        foreign_keys="SupportTicket.assigned_to_id",
        lazy="dynamic",
    )
    ticket_comments = db.relationship("TicketComment", back_populates="user", lazy="dynamic")
    support_notifications = db.relationship(
        "SupportNotification",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    notification_preferences = db.relationship(
        "NotificationPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def set_password(self, password: str) -> None:
        self.password_hash = hash_password(password)

    def check_password(self, password: str) -> bool:
        if self.password_hash.startswith("$2"):
            return verify_password(password, self.password_hash)
        return werkzeug_check_password(self.password_hash, password)

    @property
    def is_customer(self) -> bool:
        return self.role == "customer"

    @property
    def is_agent(self) -> bool:
        return self.role == "agent"

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_staff(self) -> bool:
        return self.role in ("agent", "admin")

    def get_expertise_areas(self) -> list:
        if isinstance(self.expertise_areas, list):
            return self.expertise_areas
        if isinstance(self.expertise_areas, str):
            try:
                return json.loads(self.expertise_areas)
            except json.JSONDecodeError:
                return []
        return []

    def __repr__(self) -> str:
        return f"<User {self.email}>"
