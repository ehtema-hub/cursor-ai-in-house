import logging
from typing import Any

logger = logging.getLogger(__name__)


def send_email(to: str, subject: str, body: str) -> None:
    """Mock email sender — logs instead of sending in development."""
    logger.info("EMAIL to=%s subject=%s body=%s", to, subject, body[:200])


def notify_ticket_created(ticket) -> None:
    send_email(
        ticket.customer_email,
        f"Support ticket created: {ticket.ticket_number}",
        f"Your ticket '{ticket.subject}' has been created. Ticket number: {ticket.ticket_number}.",
    )


def notify_ticket_assigned(ticket, agent) -> None:
    send_email(
        agent.email,
        f"Ticket assigned: {ticket.ticket_number}",
        f"You have been assigned ticket {ticket.ticket_number}: {ticket.subject}.",
    )


def notify_status_changed(ticket, old_status: str, new_status: str) -> None:
    message = (
        f"Ticket {ticket.ticket_number} status changed from {old_status} to {new_status}."
    )
    send_email(ticket.customer_email, f"Ticket status update: {ticket.ticket_number}", message)
    if ticket.assigned_to:
        send_email(ticket.assigned_to.email, f"Ticket status update: {ticket.ticket_number}", message)


def notify_new_comment(ticket, comment, recipients: list[str]) -> None:
    for email in recipients:
        send_email(
            email,
            f"New comment on ticket {ticket.ticket_number}",
            f"A new comment was added to ticket {ticket.ticket_number}.",
        )


def notify_sla_warning(ticket, sla_type: str, recipients: list[str]) -> None:
    for email in recipients:
        send_email(
            email,
            f"SLA warning: {ticket.ticket_number}",
            f"Ticket {ticket.ticket_number} is approaching {sla_type} SLA deadline.",
        )


def notify_sla_missed(ticket, sla_type: str, recipients: list[str]) -> None:
    for email in recipients:
        send_email(
            email,
            f"SLA missed: {ticket.ticket_number}",
            f"Ticket {ticket.ticket_number} has missed the {sla_type} SLA deadline.",
        )
