from datetime import datetime, timezone

from app.extensions import db

NOTIFICATION_TYPES = (
    "task_assigned",
    "task_updated",
    "task_completed",
    "project_invite",
    "member_joined",
    "system",
)


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    related_project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=True)
    related_task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    user = db.relationship("User", back_populates="notifications")

    def __repr__(self) -> str:
        return f"<Notification {self.type} user={self.user_id}>"
