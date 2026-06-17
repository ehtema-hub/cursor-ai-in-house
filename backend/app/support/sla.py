from datetime import datetime, timedelta, timezone

from app.support.constants import SLA_RESOLUTION_HOURS, SLA_RESPONSE_HOURS


def calculate_sla_deadlines(priority: str, created_at: datetime | None = None) -> tuple[datetime, datetime]:
    created_at = created_at or datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    response_hours = SLA_RESPONSE_HOURS.get(priority, SLA_RESPONSE_HOURS["medium"])
    resolution_hours = SLA_RESOLUTION_HOURS.get(priority, SLA_RESOLUTION_HOURS["medium"])
    return (
        created_at + timedelta(hours=response_hours),
        created_at + timedelta(hours=resolution_hours),
    )


def is_sla_approaching(deadline: datetime | None, threshold_hours: int = 2) -> bool:
    if deadline is None:
        return False
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    return now < deadline <= now + timedelta(hours=threshold_hours)


def is_sla_missed(deadline: datetime | None) -> bool:
    if deadline is None:
        return False
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) > deadline


def _ensure_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def check_and_update_sla_flags(ticket) -> None:
    first_response = _ensure_utc(ticket.first_response_at)
    response_due = _ensure_utc(ticket.sla_response_due)
    if first_response and not ticket.sla_response_met:
        if response_due and first_response <= response_due:
            ticket.sla_response_met = True

    resolved_at = _ensure_utc(ticket.resolved_at)
    resolution_due = _ensure_utc(ticket.sla_resolution_due)
    if resolved_at and not ticket.sla_resolution_met:
        if resolution_due and resolved_at <= resolution_due:
            ticket.sla_resolution_met = True
