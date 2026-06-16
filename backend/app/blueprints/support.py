import csv
import io
from datetime import datetime, timezone

from flask import request, send_file
from flask.views import MethodView
from flask_smorest import Blueprint
from sqlalchemy import or_

from app.extensions import db
from app.models.user import User
from app.support.attachments import save_attachment
from app.support.errors import SupportAPIError
from app.support.models import (
    SupportNotification,
    SupportTicket,
    TicketComment,
    TicketStatusHistory,
)
from app.support.rbac import get_current_user_required, sanitize_text
from app.support import email_service as email
from app.support.reports import get_agent_report, get_sla_report, get_ticket_report
from app.support.reports import get_dashboard_metrics
from app.support.schemas import (
    AgentSchema,
    AssignTicketSchema,
    CreateCommentSchema,
    CreateTicketSchema,
    DashboardMetricsSchema,
    ReportExportSchema,
    SupportTicketListSchema,
    SupportTicketSchema,
    TicketCommentSchema,
    TicketStatusHistorySchema,
    UpdateAvailabilitySchema,
    UpdatePrioritySchema,
    UpdateStatusSchema,
    UpdateTicketSchema,
)
from app.support.sla import calculate_sla_deadlines, check_and_update_sla_flags, is_sla_approaching, is_sla_missed
from app.support.ticket_service import (
    assign_ticket,
    auto_assign_ticket,
    generate_ticket_number,
    update_ticket_status,
    user_can_modify_ticket,
    user_can_view_ticket,
)
from app.support.validation import (
    parse_date_param,
    validate_comment_content,
    validate_priority_update,
    validate_status_update,
    validate_ticket_create,
    validate_ticket_update,
)

tickets_blp = Blueprint(
    "support_tickets",
    __name__,
    url_prefix="/api/tickets",
    description="Customer support tickets",
)

agents_blp = Blueprint(
    "support_agents",
    __name__,
    url_prefix="/api/agents",
    description="Support agents",
)

admin_blp = Blueprint(
    "support_admin",
    __name__,
    url_prefix="/api/admin",
    description="Support admin dashboard and reports",
)

PER_PAGE = 20


def _enrich_ticket(ticket: SupportTicket) -> SupportTicket:
    check_and_update_sla_flags(ticket)
    ticket.sla_response_approaching = is_sla_approaching(ticket.sla_response_due)
    ticket.sla_resolution_approaching = is_sla_approaching(ticket.sla_resolution_due)
    ticket.sla_response_missed = is_sla_missed(ticket.sla_response_due) and not ticket.sla_response_met
    ticket.sla_resolution_missed = is_sla_missed(ticket.sla_resolution_due) and not ticket.sla_resolution_met
    return ticket


def _get_ticket_or_404(ticket_id: int) -> SupportTicket:
    ticket = SupportTicket.query.get(ticket_id)
    if ticket is None:
        raise SupportAPIError("Ticket not found.", "NOT_FOUND", 404)
    return ticket


def _apply_ticket_filters(query, user: User):
    if user.is_admin:
        pass
    elif user.is_agent:
        query = query.filter(
            or_(
                SupportTicket.assigned_to_id == user.id,
                SupportTicket.assigned_to_id.is_(None),
                SupportTicket.status == "open",
            )
        )
    else:
        query = query.filter(
            or_(
                SupportTicket.customer_id == user.id,
                SupportTicket.customer_email == user.email.lower(),
            )
        )

    q = request.args.get("q")
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            or_(
                SupportTicket.ticket_number.ilike(like),
                SupportTicket.subject.ilike(like),
                SupportTicket.description.ilike(like),
                SupportTicket.customer_email.ilike(like),
            )
        )

    status = request.args.get("status")
    if status:
        statuses = [s.strip().lower().replace(" ", "_") for s in status.split(",")]
        query = query.filter(SupportTicket.status.in_(statuses))

    priority = request.args.get("priority")
    if priority:
        priorities = [p.strip().lower() for p in priority.split(",")]
        query = query.filter(SupportTicket.priority.in_(priorities))

    category = request.args.get("category")
    if category:
        query = query.filter(SupportTicket.category == category.lower().replace(" ", "_"))

    assigned_to = request.args.get("assigned_to_id")
    if assigned_to == "unassigned":
        query = query.filter(SupportTicket.assigned_to_id.is_(None))
    elif assigned_to:
        query = query.filter(SupportTicket.assigned_to_id == int(assigned_to))

    customer_email = request.args.get("customer_email")
    if customer_email:
        query = query.filter(SupportTicket.customer_email == customer_email.lower())

    created_from = parse_date_param(request.args.get("created_from"), "created_from")
    created_to = parse_date_param(request.args.get("created_to"), "created_to")
    if created_from:
        query = query.filter(SupportTicket.created_at >= created_from)
    if created_to:
        query = query.filter(SupportTicket.created_at <= created_to)

    return query


@tickets_blp.route("/")
class TicketList(MethodView):
    @tickets_blp.response(200, SupportTicketListSchema)
    def get(self):
        """List support tickets with search and filters."""
        user = get_current_user_required()
        page = max(int(request.args.get("page", 1)), 1)
        query = _apply_ticket_filters(SupportTicket.query, user)
        query = query.order_by(SupportTicket.created_at.desc())
        pagination = query.paginate(page=page, per_page=PER_PAGE, error_out=False)
        return {
            "tickets": [_enrich_ticket(t) for t in pagination.items],
            "meta": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total": pagination.total,
                "pages": pagination.pages,
            },
        }

    @tickets_blp.arguments(CreateTicketSchema, location="json")
    @tickets_blp.response(201, SupportTicketSchema)
    def post(self, data):
        """Create a new support ticket."""
        user = get_current_user_required()
        validated = validate_ticket_create(data)

        if user.is_customer:
            validated["customer_email"] = user.email.lower()
            validated["customer_id"] = user.id
        elif validated["customer_email"] == user.email.lower():
            validated["customer_id"] = user.id

        response_due, resolution_due = calculate_sla_deadlines(validated["priority"])

        ticket = SupportTicket(
            ticket_number=generate_ticket_number(),
            subject=validated["subject"],
            description=validated["description"],
            priority=validated["priority"],
            category=validated["category"],
            customer_email=validated["customer_email"],
            customer_id=validated.get("customer_id"),
            status="open",
            sla_response_due=response_due,
            sla_resolution_due=resolution_due,
        )
        db.session.add(ticket)
        db.session.flush()

        db.session.add(
            TicketStatusHistory(
                ticket_id=ticket.id,
                from_status=None,
                to_status="open",
                changed_by_id=user.id,
                changed_by_email=user.email,
                note="Ticket created",
            )
        )

        auto_assign = request.args.get("auto_assign", "true").lower() != "false"
        if auto_assign:
            assigner = user if user.is_staff else User.query.filter_by(role="admin").first() or user
            auto_assign_ticket(ticket, assigner)

        db.session.commit()
        email.notify_ticket_created(ticket)
        return _enrich_ticket(ticket)


@tickets_blp.route("/export")
class TicketExport(MethodView):
    def get(self):
        """Export filtered tickets to CSV."""
        user = get_current_user_required()
        if not user.is_staff:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        query = _apply_ticket_filters(SupportTicket.query, user)
        tickets = query.order_by(SupportTicket.created_at.desc()).all()

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(
            [
                "ticket_number",
                "subject",
                "status",
                "priority",
                "category",
                "customer_email",
                "assigned_to_id",
                "created_at",
                "resolved_at",
            ]
        )
        for ticket in tickets:
            writer.writerow(
                [
                    ticket.ticket_number,
                    ticket.subject,
                    ticket.status,
                    ticket.priority,
                    ticket.category,
                    ticket.customer_email,
                    ticket.assigned_to_id or "",
                    ticket.created_at.isoformat() if ticket.created_at else "",
                    ticket.resolved_at.isoformat() if ticket.resolved_at else "",
                ]
            )

        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode("utf-8")),
            mimetype="text/csv",
            as_attachment=True,
            download_name="tickets_export.csv",
        )


@tickets_blp.route("/<int:ticket_id>")
class TicketDetail(MethodView):
    @tickets_blp.response(200, SupportTicketSchema)
    def get(self, ticket_id):
        """Get ticket details."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)
        if not user_can_view_ticket(user, ticket):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        return _enrich_ticket(ticket)

    @tickets_blp.arguments(UpdateTicketSchema)
    @tickets_blp.response(200, SupportTicketSchema)
    def put(self, data, ticket_id):
        """Update ticket subject/description."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)
        if not user_can_modify_ticket(user, ticket):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        validated = validate_ticket_update(data)
        for key, value in validated.items():
            setattr(ticket, key, value)
        db.session.commit()
        return _enrich_ticket(ticket)

    @tickets_blp.response(204)
    def delete(self, ticket_id):
        """Delete ticket (admin only)."""
        user = get_current_user_required()
        if not user.is_admin:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        ticket = _get_ticket_or_404(ticket_id)
        db.session.delete(ticket)
        db.session.commit()
        return ""


@tickets_blp.route("/<int:ticket_id>/comments")
class TicketComments(MethodView):
    @tickets_blp.response(200, TicketCommentSchema(many=True))
    def get(self, ticket_id):
        """List ticket comments."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)
        if not user_can_view_ticket(user, ticket):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        comments = (
            TicketComment.query.filter_by(ticket_id=ticket.id)
            .order_by(TicketComment.created_at.asc())
            .all()
        )
        if user.is_customer:
            comments = [c for c in comments if not c.is_internal]
        return comments

    @tickets_blp.arguments(CreateCommentSchema)
    @tickets_blp.response(201, TicketCommentSchema)
    def post(self, data, ticket_id):
        """Add a comment to a ticket."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)
        if not user_can_view_ticket(user, ticket):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        is_internal = data.get("is_internal", False)
        if is_internal and not user.is_staff:
            raise SupportAPIError("Customers cannot add internal comments.", "FORBIDDEN", 403)

        content = validate_comment_content(data["content"])
        comment = TicketComment(
            ticket_id=ticket.id,
            user_id=user.id,
            author_name=user.name,
            author_email=user.email,
            content=content,
            is_internal=is_internal,
            mentions=data.get("mentions") or [],
        )
        db.session.add(comment)

        if ticket.first_response_at is None and user.is_staff:
            ticket.first_response_at = datetime.now(timezone.utc)
            check_and_update_sla_flags(ticket)

        db.session.flush()

        recipients = {ticket.customer_email}
        if ticket.assigned_to:
            recipients.add(ticket.assigned_to.email)
        if not is_internal:
            email.notify_new_comment(ticket, comment, list(recipients))

        if ticket.customer_id:
            db.session.add(
                SupportNotification(
                    user_id=ticket.customer_id,
                    ticket_id=ticket.id,
                    type="new_comment",
                    title="New comment on your ticket",
                    message=f"New comment on ticket {ticket.ticket_number}.",
                )
            )

        if ticket.assigned_to_id:
            db.session.add(
                SupportNotification(
                    user_id=ticket.assigned_to_id,
                    ticket_id=ticket.id,
                    type="new_comment",
                    title="New comment on assigned ticket",
                    message=f"New comment on ticket {ticket.ticket_number}.",
                )
            )

        db.session.commit()
        return comment


@tickets_blp.route("/<int:ticket_id>/status")
class TicketStatus(MethodView):
    @tickets_blp.arguments(UpdateStatusSchema)
    @tickets_blp.response(200, SupportTicketSchema)
    def put(self, data, ticket_id):
        """Update ticket status."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)

        new_status = validate_status_update(data["status"])
        if user.is_customer:
            if new_status != "reopened":
                raise SupportAPIError("Customers can only reopen tickets.", "FORBIDDEN", 403)
        elif not user.is_staff:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        elif user.is_agent and not user_can_modify_ticket(user, ticket):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        note = sanitize_text(data.get("note") or "")
        update_ticket_status(ticket, new_status, user, note or None)
        check_and_update_sla_flags(ticket)
        db.session.commit()
        return _enrich_ticket(ticket)


@tickets_blp.route("/<int:ticket_id>/priority")
class TicketPriority(MethodView):
    @tickets_blp.arguments(UpdatePrioritySchema)
    @tickets_blp.response(200, SupportTicketSchema)
    def put(self, data, ticket_id):
        """Update ticket priority (agents/admins)."""
        user = get_current_user_required()
        if not user.is_staff:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        ticket = _get_ticket_or_404(ticket_id)
        if user.is_agent and ticket.assigned_to_id not in (None, user.id):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        priority, reason = validate_priority_update(data["priority"], data["reason"])
        ticket.priority = priority
        ticket.priority_change_reason = reason
        response_due, resolution_due = calculate_sla_deadlines(priority, ticket.created_at)
        ticket.sla_response_due = response_due
        ticket.sla_resolution_due = resolution_due
        db.session.commit()
        return _enrich_ticket(ticket)


@tickets_blp.route("/<int:ticket_id>/assign")
class TicketAssign(MethodView):
    @tickets_blp.arguments(AssignTicketSchema)
    @tickets_blp.response(200, SupportTicketSchema)
    def post(self, data, ticket_id):
        """Assign ticket to an agent."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)

        if data.get("auto_assign"):
            if not user.is_staff:
                raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
            auto_assign_ticket(ticket, user)
        else:
            if not user.is_admin:
                raise SupportAPIError("Only administrators can manually assign tickets.", "FORBIDDEN", 403)
            agent = User.query.get(data["assigned_to_id"])
            if agent is None:
                raise SupportAPIError("Agent not found.", "NOT_FOUND", 404)
            assign_ticket(ticket, agent, user, data.get("note"))

        db.session.commit()
        return _enrich_ticket(ticket)


@tickets_blp.route("/<int:ticket_id>/history")
class TicketHistory(MethodView):
    @tickets_blp.response(200, TicketStatusHistorySchema(many=True))
    def get(self, ticket_id):
        """Get ticket status history."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)
        if not user_can_view_ticket(user, ticket):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        return (
            TicketStatusHistory.query.filter_by(ticket_id=ticket.id)
            .order_by(TicketStatusHistory.created_at.asc())
            .all()
        )


@tickets_blp.route("/<int:ticket_id>/attachments")
class TicketAttachments(MethodView):
    @tickets_blp.response(201, SupportTicketSchema)
    def post(self, ticket_id):
        """Upload attachment to ticket."""
        user = get_current_user_required()
        ticket = _get_ticket_or_404(ticket_id)
        if not user_can_modify_ticket(user, ticket):
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        if "file" not in request.files:
            raise SupportAPIError(
                "No file provided.",
                "VALIDATION_ERROR",
                400,
                {"file": ["Attachment file is required."]},
            )
        save_attachment(ticket.id, request.files["file"])
        db.session.commit()
        return _enrich_ticket(ticket)


@agents_blp.route("/")
class AgentList(MethodView):
    @agents_blp.response(200, AgentSchema(many=True))
    def get(self):
        """List support agents."""
        user = get_current_user_required()
        if not user.is_staff:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        agents = User.query.filter_by(role="agent", is_active=True).order_by(User.name).all()
        result = []
        for agent in agents:
            open_count = SupportTicket.query.filter(
                SupportTicket.assigned_to_id == agent.id,
                SupportTicket.status.in_(("assigned", "in_progress", "waiting", "reopened")),
            ).count()
            data = AgentSchema().dump(agent)
            data["open_ticket_count"] = open_count
            result.append(data)
        return result


@agents_blp.route("/<int:agent_id>/tickets")
class AgentTickets(MethodView):
    @agents_blp.response(200, SupportTicketListSchema)
    def get(self, agent_id):
        """Get tickets assigned to an agent."""
        user = get_current_user_required()
        agent = User.query.filter_by(id=agent_id, role="agent").first()
        if agent is None:
            raise SupportAPIError("Agent not found.", "NOT_FOUND", 404)
        if not user.is_admin and user.id != agent_id:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        page = max(int(request.args.get("page", 1)), 1)
        query = SupportTicket.query.filter_by(assigned_to_id=agent_id)
        pagination = query.order_by(SupportTicket.created_at.desc()).paginate(
            page=page, per_page=PER_PAGE, error_out=False
        )
        return {
            "tickets": [_enrich_ticket(t) for t in pagination.items],
            "meta": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total": pagination.total,
                "pages": pagination.pages,
            },
        }


@agents_blp.route("/<int:agent_id>/availability")
class AgentAvailability(MethodView):
    @agents_blp.arguments(UpdateAvailabilitySchema)
    @agents_blp.response(200, AgentSchema)
    def put(self, data, agent_id):
        """Update agent availability status."""
        user = get_current_user_required()
        agent = User.query.filter_by(id=agent_id, role="agent").first()
        if agent is None:
            raise SupportAPIError("Agent not found.", "NOT_FOUND", 404)
        if not user.is_admin and user.id != agent_id:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        agent.availability_status = data["availability_status"]
        db.session.commit()
        data_out = AgentSchema().dump(agent)
        data_out["open_ticket_count"] = SupportTicket.query.filter(
            SupportTicket.assigned_to_id == agent.id,
            SupportTicket.status.in_(("assigned", "in_progress", "waiting", "reopened")),
        ).count()
        return data_out


@admin_blp.route("/dashboard")
class AdminDashboard(MethodView):
    @admin_blp.response(200, DashboardMetricsSchema)
    def get(self):
        """Admin dashboard metrics."""
        user = get_current_user_required()
        if not user.is_admin:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        return get_dashboard_metrics()


@admin_blp.route("/reports/tickets")
class TicketReports(MethodView):
    def get(self):
        """Ticket volume reports."""
        user = get_current_user_required()
        if not user.is_admin and not user.is_agent:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        period = request.args.get("period", "monthly")
        return get_ticket_report(period)


@admin_blp.route("/reports/agents")
class AgentReports(MethodView):
    def get(self):
        """Agent performance reports."""
        user = get_current_user_required()
        if not user.is_admin:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        return get_agent_report()


@admin_blp.route("/reports/sla")
class SlaReports(MethodView):
    def get(self):
        """SLA compliance reports."""
        user = get_current_user_required()
        if not user.is_admin:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)
        return get_sla_report()


@admin_blp.route("/reports/export")
class ReportExport(MethodView):
    @admin_blp.arguments(ReportExportSchema)
    def post(self, data):
        """Export report as CSV or JSON."""
        user = get_current_user_required()
        if not user.is_admin:
            raise SupportAPIError("Insufficient permissions.", "FORBIDDEN", 403)

        report_type = data["report_type"]
        period = data.get("period", "monthly")
        fmt = data.get("format", "csv")

        if report_type == "tickets":
            payload = get_ticket_report(period)
        elif report_type == "agents":
            payload = get_agent_report()
        else:
            payload = get_sla_report()

        if fmt == "json":
            return payload

        output = io.StringIO()
        writer = csv.writer(output)
        if report_type == "tickets":
            writer.writerow(["metric", "value"])
            writer.writerow(["period", payload["period"]])
            writer.writerow(["total_created", payload["total_created"]])
            for status, count in payload["by_status"].items():
                writer.writerow([f"status_{status}", count])
            for category, count in payload["by_category"].items():
                writer.writerow([f"category_{category}", count])
        elif report_type == "agents":
            writer.writerow(["agent_id", "agent_name", "assigned_tickets", "resolved_tickets"])
            for row in payload["agents"]:
                writer.writerow(
                    [row["agent_id"], row["agent_name"], row["assigned_tickets"], row["resolved_tickets"]]
                )
        else:
            writer.writerow(["metric", "value"])
            for key, value in payload.items():
                writer.writerow([key, value])

        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode("utf-8")),
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"{report_type}_report.csv",
        )
