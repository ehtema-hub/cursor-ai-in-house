from datetime import datetime, timezone

from sqlalchemy import func

from app.extensions import db
from app.models.user import User
from app.support.constants import STATUS_TRANSITIONS
from app.support.errors import SupportAPIError
from app.support.models import (
    SupportNotification,
    SupportTicket,
    TicketAssignment,
    TicketStatusHistory,
)
from app.support.sla import calculate_sla_deadlines
from app.support import email_service as email


def generate_ticket_number() -> str:
    from app.support.models import TicketCounter

    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    counter_row = TicketCounter.query.filter_by(date_key=today).with_for_update().first()
    if counter_row is None:
        counter_row = TicketCounter(date_key=today, counter=0)
        db.session.add(counter_row)
        db.session.flush()

    counter_row.counter += 1
    return f"TICK-{today}-{counter_row.counter:04d}"


def find_best_agent(category: str) -> User | None:
    agents = (
        User.query.filter(
            User.role == "agent",
            User.is_active.is_(True),
            User.availability_status == "available",
        )
        .all()
    )
    if not agents:
        return None

    def score(agent: User) -> tuple[int, int]:
        expertise_match = 0 if category in agent.get_expertise_areas() else 1
        open_count = SupportTicket.query.filter(
            SupportTicket.assigned_to_id == agent.id,
            SupportTicket.status.in_(("open", "assigned", "in_progress", "waiting", "reopened")),
        ).count()
        return (expertise_match, open_count)

    return min(agents, key=score)


def assign_ticket(
    ticket: SupportTicket,
    agent: User,
    assigned_by: User,
    note: str | None = None,
    auto: bool = False,
) -> TicketAssignment:
    if agent.role != "agent":
        raise SupportAPIError(
            "Can only assign tickets to support agents.",
            "VALIDATION_ERROR",
            400,
            {"assigned_to_id": ["User is not an agent."]},
        )

    old_status = ticket.status
    ticket.assigned_to_id = agent.id
    if old_status == "open":
        ticket.status = "assigned"

    assignment = TicketAssignment(
        ticket_id=ticket.id,
        assigned_to_id=agent.id,
        assigned_by_id=assigned_by.id,
        note=note or ("Auto-assigned based on workload and expertise." if auto else None),
    )
    db.session.add(assignment)

    if old_status == "open":
        db.session.add(
            TicketStatusHistory(
                ticket_id=ticket.id,
                from_status=old_status,
                to_status="assigned",
                changed_by_id=assigned_by.id,
                changed_by_email=assigned_by.email,
                note=assignment.note,
            )
        )

    _create_notification(
        agent.id,
        ticket.id,
        "ticket_assigned",
        "Ticket assigned to you",
        f"Ticket {ticket.ticket_number} has been assigned to you.",
    )
    email.notify_ticket_assigned(ticket, agent)
    return assignment


def auto_assign_ticket(ticket: SupportTicket, assigned_by: User) -> TicketAssignment | None:
    agent = find_best_agent(ticket.category)
    if agent is None:
        return None
    return assign_ticket(ticket, agent, assigned_by, auto=True)


def _validate_reopen_transition(ticket: SupportTicket, user: User) -> None:
    from datetime import timedelta

    from app.support.constants import REOPEN_WINDOW_DAYS

    if ticket.closed_at is None:
        raise SupportAPIError(
            "Cannot reopen ticket without close timestamp.",
            "VALIDATION_ERROR",
            400,
        )
    closed_at = ticket.closed_at
    if closed_at.tzinfo is None:
        closed_at = closed_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) - closed_at > timedelta(days=REOPEN_WINDOW_DAYS):
        raise SupportAPIError(
            "Tickets can only be reopened within 7 days of closing.",
            "FORBIDDEN",
            403,
        )
    if not user.is_customer:
        return
    is_owner = (
        ticket.customer_id == user.id
        or ticket.customer_email.lower() == user.email.lower()
    )
    if not is_owner:
        raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)


def validate_status_transition(ticket: SupportTicket, new_status: str, user: User) -> None:
    current = ticket.status
    if current == new_status:
        return

    allowed = STATUS_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        raise SupportAPIError(
            f"Cannot transition from '{current}' to '{new_status}'.",
            "VALIDATION_ERROR",
            400,
            {"status": [f"Invalid status transition from {current} to {new_status}."]},
        )

    if current == "closed" and new_status == "reopened":
        _validate_reopen_transition(ticket, user)


def update_ticket_status(
    ticket: SupportTicket,
    new_status: str,
    user: User,
    note: str | None = None,
) -> TicketStatusHistory:
    validate_status_transition(ticket, new_status, user)
    old_status = ticket.status
    ticket.status = new_status
    now = datetime.now(timezone.utc)

    if new_status == "resolved":
        ticket.resolved_at = now
    elif new_status == "closed":
        ticket.closed_at = now
    elif new_status == "reopened":
        ticket.reopened_at = now
        ticket.resolved_at = None
        ticket.closed_at = None

    history = TicketStatusHistory(
        ticket_id=ticket.id,
        from_status=old_status,
        to_status=new_status,
        changed_by_id=user.id,
        changed_by_email=user.email,
        note=note,
    )
    db.session.add(history)

    recipients = {ticket.customer_email}
    if ticket.assigned_to:
        recipients.add(ticket.assigned_to.email)
    email.notify_status_changed(ticket, old_status, new_status)

    if ticket.customer_id:
        _create_notification(
            ticket.customer_id,
            ticket.id,
            "status_changed",
            "Ticket status updated",
            f"Ticket {ticket.ticket_number} is now {new_status}.",
        )

    for recipient in recipients:
        notify_user = User.query.filter_by(email=recipient).first()
        if notify_user and notify_user.is_staff:
            _create_notification(
                notify_user.id,
                ticket.id,
                "status_changed",
                "Ticket status updated",
                f"Ticket {ticket.ticket_number} is now {new_status}.",
            )

    return history


def _create_notification(user_id: int, ticket_id: int, ntype: str, title: str, message: str) -> None:
    db.session.add(
        SupportNotification(
            user_id=user_id,
            ticket_id=ticket_id,
            type=ntype,
            title=title,
            message=message,
        )
    )


def user_can_view_ticket(user: User, ticket: SupportTicket) -> bool:
    if user.is_admin:
        return True
    if user.is_agent:
        return (
            ticket.assigned_to_id == user.id
            or ticket.assigned_to_id is None
            or ticket.status == "open"
        )
    return ticket.customer_id == user.id or ticket.customer_email.lower() == user.email.lower()


def user_can_modify_ticket(user: User, ticket: SupportTicket) -> bool:
    if user.is_admin:
        return True
    if user.is_agent:
        return ticket.assigned_to_id == user.id or ticket.assigned_to_id is None
    return ticket.customer_id == user.id or ticket.customer_email.lower() == user.email.lower()
