from datetime import datetime, timezone

from app.extensions import db
from app.models.mixins import TimestampMixin
from app.support.constants import (
    AVAILABILITY_STATUSES,
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
    USER_ROLES,
)


class SupportTicket(db.Model, TimestampMixin):
    __tablename__ = "support_tickets"

    id = db.Column(db.Integer, primary_key=True)
    ticket_number = db.Column(db.String(30), unique=True, nullable=False, index=True)
    subject = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), nullable=False, default="open", index=True)
    priority = db.Column(db.String(20), nullable=False, default="medium", index=True)
    category = db.Column(db.String(50), nullable=False, index=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    customer_email = db.Column(db.String(255), nullable=False, index=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    sla_response_due = db.Column(db.DateTime, nullable=True)
    sla_resolution_due = db.Column(db.DateTime, nullable=True)
    sla_response_met = db.Column(db.Boolean, default=False, nullable=False)
    sla_resolution_met = db.Column(db.Boolean, default=False, nullable=False)
    first_response_at = db.Column(db.DateTime, nullable=True)
    resolved_at = db.Column(db.DateTime, nullable=True)
    closed_at = db.Column(db.DateTime, nullable=True)
    reopened_at = db.Column(db.DateTime, nullable=True)
    priority_change_reason = db.Column(db.Text, nullable=True)

    customer = db.relationship("User", foreign_keys=[customer_id], back_populates="support_tickets")
    assigned_to = db.relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_support_tickets")
    comments = db.relationship("TicketComment", back_populates="ticket", cascade="all, delete-orphan")
    attachments = db.relationship("TicketAttachment", back_populates="ticket", cascade="all, delete-orphan")
    assignments = db.relationship("TicketAssignment", back_populates="ticket", cascade="all, delete-orphan")
    status_history = db.relationship("TicketStatusHistory", back_populates="ticket", cascade="all, delete-orphan")


class TicketComment(db.Model):
    __tablename__ = "ticket_comments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    author_name = db.Column(db.String(120), nullable=False)
    author_email = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False, nullable=False)
    mentions = db.Column(db.JSON, default=list)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    ticket = db.relationship("SupportTicket", back_populates="comments")
    user = db.relationship("User", back_populates="ticket_comments")
    attachments = db.relationship("TicketAttachment", back_populates="comment", cascade="all, delete-orphan")


class TicketAssignment(db.Model):
    __tablename__ = "ticket_assignments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    note = db.Column(db.Text, nullable=True)

    ticket = db.relationship("SupportTicket", back_populates="assignments")
    assigned_to = db.relationship("User", foreign_keys=[assigned_to_id])
    assigned_by = db.relationship("User", foreign_keys=[assigned_by_id])


class TicketAttachment(db.Model):
    __tablename__ = "ticket_attachments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    comment_id = db.Column(db.Integer, db.ForeignKey("ticket_comments.id"), nullable=True, index=True)
    filename = db.Column(db.String(255), nullable=False)
    stored_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    file_type = db.Column(db.String(100), nullable=False)
    uploaded_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    ticket = db.relationship("SupportTicket", back_populates="attachments")
    comment = db.relationship("TicketComment", back_populates="attachments")


class TicketStatusHistory(db.Model):
    __tablename__ = "ticket_status_history"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=False, index=True)
    from_status = db.Column(db.String(20), nullable=True)
    to_status = db.Column(db.String(20), nullable=False)
    changed_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    changed_by_email = db.Column(db.String(255), nullable=False)
    note = db.Column(db.Text, nullable=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    ticket = db.relationship("SupportTicket", back_populates="status_history")
    changed_by = db.relationship("User")


class SupportNotification(db.Model):
    __tablename__ = "support_notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("support_tickets.id"), nullable=True, index=True)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    user = db.relationship("User", back_populates="support_notifications")


class NotificationPreference(db.Model):
    __tablename__ = "notification_preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    email_ticket_created = db.Column(db.Boolean, default=True, nullable=False)
    email_ticket_assigned = db.Column(db.Boolean, default=True, nullable=False)
    email_status_changed = db.Column(db.Boolean, default=True, nullable=False)
    email_new_comment = db.Column(db.Boolean, default=True, nullable=False)
    email_sla_warning = db.Column(db.Boolean, default=True, nullable=False)
    in_app_enabled = db.Column(db.Boolean, default=True, nullable=False)

    user = db.relationship("User", back_populates="notification_preferences")


class TicketCounter(db.Model):
    __tablename__ = "ticket_counters"

    id = db.Column(db.Integer, primary_key=True)
    date_key = db.Column(db.String(8), unique=True, nullable=False)
    counter = db.Column(db.Integer, default=0, nullable=False)
