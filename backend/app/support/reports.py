from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from app.extensions import db
from app.models.user import User
from app.support.models import SupportTicket, TicketStatusHistory


def _avg_resolution_hours() -> float:
    tickets = SupportTicket.query.filter(
        SupportTicket.resolved_at.isnot(None),
        SupportTicket.created_at.isnot(None),
    ).all()
    if not tickets:
        return 0.0
    total = 0.0
    for ticket in tickets:
        created = ticket.created_at
        resolved = ticket.resolved_at
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if resolved.tzinfo is None:
            resolved = resolved.replace(tzinfo=timezone.utc)
        total += (resolved - created).total_seconds() / 3600
    return round(total / len(tickets), 2)


def get_dashboard_metrics() -> dict:
    total = SupportTicket.query.count()
    open_count = SupportTicket.query.filter(
        SupportTicket.status.in_(("open", "assigned", "reopened"))
    ).count()
    in_progress = SupportTicket.query.filter(
        SupportTicket.status.in_(("in_progress", "waiting"))
    ).count()
    resolved = SupportTicket.query.filter_by(status="resolved").count()
    closed = SupportTicket.query.filter_by(status="closed").count()

    priority_rows = (
        db.session.query(SupportTicket.priority, func.count(SupportTicket.id))
        .group_by(SupportTicket.priority)
        .all()
    )
    category_rows = (
        db.session.query(SupportTicket.category, func.count(SupportTicket.id))
        .group_by(SupportTicket.category)
        .all()
    )

    sla_total = SupportTicket.query.filter(SupportTicket.resolved_at.isnot(None)).count()
    sla_met = SupportTicket.query.filter_by(sla_resolution_met=True).count()
    sla_rate = round((sla_met / sla_total) * 100, 2) if sla_total else 100.0

    agents = User.query.filter_by(role="agent", is_active=True).all()
    agent_performance = []
    for agent in agents:
        assigned = SupportTicket.query.filter_by(assigned_to_id=agent.id).count()
        resolved_count = SupportTicket.query.filter(
            SupportTicket.assigned_to_id == agent.id,
            SupportTicket.status.in_(("resolved", "closed")),
        ).count()
        agent_performance.append(
            {
                "agent_id": agent.id,
                "agent_name": agent.name,
                "assigned_tickets": assigned,
                "resolved_tickets": resolved_count,
                "availability_status": agent.availability_status,
            }
        )

    return {
        "total_tickets": total,
        "open_tickets": open_count,
        "in_progress_tickets": in_progress,
        "resolved_tickets": resolved,
        "closed_tickets": closed,
        "average_resolution_hours": _avg_resolution_hours(),
        "tickets_by_priority": {row[0]: row[1] for row in priority_rows},
        "tickets_by_category": {row[0]: row[1] for row in category_rows},
        "sla_compliance_rate": sla_rate,
        "agent_performance": agent_performance,
    }


def _period_start(period: str) -> datetime:
    now = datetime.now(timezone.utc)
    if period == "daily":
        return now - timedelta(days=1)
    if period == "weekly":
        return now - timedelta(days=7)
    return now - timedelta(days=30)


def get_ticket_report(period: str = "monthly") -> dict:
    start = _period_start(period)
    tickets = SupportTicket.query.filter(SupportTicket.created_at >= start).all()
    by_status = {}
    by_category = {}
    for ticket in tickets:
        by_status[ticket.status] = by_status.get(ticket.status, 0) + 1
        by_category[ticket.category] = by_category.get(ticket.category, 0) + 1
    return {
        "period": period,
        "total_created": len(tickets),
        "by_status": by_status,
        "by_category": by_category,
    }


def get_agent_report() -> dict:
    return {"agents": get_dashboard_metrics()["agent_performance"]}


def get_sla_report() -> dict:
    total = SupportTicket.query.count()
    response_met = SupportTicket.query.filter_by(sla_response_met=True).count()
    resolution_met = SupportTicket.query.filter_by(sla_resolution_met=True).count()
    missed_response = SupportTicket.query.filter(
        SupportTicket.sla_response_due.isnot(None),
        SupportTicket.sla_response_met.is_(False),
        SupportTicket.first_response_at.is_(None),
        SupportTicket.sla_response_due < datetime.now(timezone.utc),
    ).count()
    missed_resolution = SupportTicket.query.filter(
        SupportTicket.sla_resolution_due.isnot(None),
        SupportTicket.sla_resolution_met.is_(False),
        SupportTicket.resolved_at.is_(None),
        SupportTicket.sla_resolution_due < datetime.now(timezone.utc),
    ).count()
    return {
        "total_tickets": total,
        "response_sla_met": response_met,
        "resolution_sla_met": resolution_met,
        "missed_response_sla": missed_response,
        "missed_resolution_sla": missed_resolution,
        "response_compliance_rate": round((response_met / total) * 100, 2) if total else 100.0,
        "resolution_compliance_rate": round((resolution_met / total) * 100, 2) if total else 100.0,
    }
