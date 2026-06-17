from marshmallow import Schema, fields, validate

from app.support.constants import (
    AVAILABILITY_STATUSES,
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
    USER_ROLES,
)


class PaginationMetaSchema(Schema):
    page = fields.Int()
    per_page = fields.Int()
    total = fields.Int()
    pages = fields.Int()


class TicketAttachmentSchema(Schema):
    id = fields.Int(dump_only=True)
    ticket_id = fields.Int(dump_only=True)
    comment_id = fields.Int(dump_only=True, allow_none=True)
    filename = fields.Str()
    file_size = fields.Int()
    file_type = fields.Str()
    uploaded_at = fields.DateTime(dump_only=True)


class TicketCommentSchema(Schema):
    id = fields.Int(dump_only=True)
    ticket_id = fields.Int(dump_only=True)
    user_id = fields.Int(dump_only=True, allow_none=True)
    author_name = fields.Str()
    author_email = fields.Str()
    content = fields.Str()
    is_internal = fields.Bool()
    mentions = fields.List(fields.Str())
    created_at = fields.DateTime(dump_only=True)
    attachments = fields.Nested(TicketAttachmentSchema, many=True, dump_only=True)


class TicketStatusHistorySchema(Schema):
    id = fields.Int(dump_only=True)
    ticket_id = fields.Int(dump_only=True)
    from_status = fields.Str(allow_none=True)
    to_status = fields.Str()
    changed_by_id = fields.Int(dump_only=True, allow_none=True)
    changed_by_email = fields.Str()
    note = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)


class TicketAssignmentSchema(Schema):
    id = fields.Int(dump_only=True)
    ticket_id = fields.Int(dump_only=True)
    assigned_to_id = fields.Int()
    assigned_by_id = fields.Int(dump_only=True)
    assigned_at = fields.DateTime(dump_only=True)
    note = fields.Str(allow_none=True)


class SupportTicketSchema(Schema):
    id = fields.Int(dump_only=True)
    ticket_number = fields.Str(dump_only=True)
    subject = fields.Str()
    description = fields.Str()
    status = fields.Str()
    priority = fields.Str()
    category = fields.Str()
    customer_id = fields.Int(dump_only=True, allow_none=True)
    customer_email = fields.Str()
    assigned_to_id = fields.Int(allow_none=True)
    sla_response_due = fields.DateTime(dump_only=True, allow_none=True)
    sla_resolution_due = fields.DateTime(dump_only=True, allow_none=True)
    sla_response_met = fields.Bool(dump_only=True)
    sla_resolution_met = fields.Bool(dump_only=True)
    sla_response_approaching = fields.Bool(dump_only=True)
    sla_resolution_approaching = fields.Bool(dump_only=True)
    sla_response_missed = fields.Bool(dump_only=True)
    sla_resolution_missed = fields.Bool(dump_only=True)
    first_response_at = fields.DateTime(dump_only=True, allow_none=True)
    resolved_at = fields.DateTime(dump_only=True, allow_none=True)
    closed_at = fields.DateTime(dump_only=True, allow_none=True)
    reopened_at = fields.DateTime(dump_only=True, allow_none=True)
    priority_change_reason = fields.Str(dump_only=True, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    comments = fields.Nested(TicketCommentSchema, many=True, dump_only=True)
    attachments = fields.Nested(TicketAttachmentSchema, many=True, dump_only=True)
    status_history = fields.Nested(TicketStatusHistorySchema, many=True, dump_only=True)
    assignments = fields.Nested(TicketAssignmentSchema, many=True, dump_only=True)


class SupportTicketListSchema(Schema):
    tickets = fields.Nested(SupportTicketSchema, many=True)
    meta = fields.Nested(PaginationMetaSchema)


class CreateTicketSchema(Schema):
    subject = fields.Str(required=True)
    description = fields.Str(required=True)
    priority = fields.Str(load_default="medium", validate=validate.OneOf(TICKET_PRIORITIES))
    category = fields.Str(required=True)
    customer_email = fields.Str(required=True)


class UpdateTicketSchema(Schema):
    subject = fields.Str(required=False)
    description = fields.Str(required=False)


class UpdateStatusSchema(Schema):
    status = fields.Str(required=True, validate=validate.OneOf(TICKET_STATUSES))
    note = fields.Str(required=False, allow_none=True)


class UpdatePrioritySchema(Schema):
    priority = fields.Str(required=True, validate=validate.OneOf(TICKET_PRIORITIES))
    reason = fields.Str(required=True)


class AssignTicketSchema(Schema):
    assigned_to_id = fields.Int(required=False, allow_none=True)
    note = fields.Str(required=False, allow_none=True)
    auto_assign = fields.Bool(load_default=False)


class CreateCommentSchema(Schema):
    content = fields.Str(required=True)
    is_internal = fields.Bool(load_default=False)
    mentions = fields.List(fields.Str(), load_default=list)


class AgentSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    email = fields.Str()
    role = fields.Str()
    availability_status = fields.Str()
    expertise_areas = fields.List(fields.Str())
    open_ticket_count = fields.Int(dump_only=True)
    is_active = fields.Bool()


class UpdateAvailabilitySchema(Schema):
    availability_status = fields.Str(required=True, validate=validate.OneOf(AVAILABILITY_STATUSES))


class SupportUserSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str()
    email = fields.Str()
    role = fields.Str(validate=validate.OneOf(USER_ROLES))
    availability_status = fields.Str()
    expertise_areas = fields.List(fields.Str())
    is_active = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UpdateSupportUserSchema(Schema):
    name = fields.Str(required=False)
    role = fields.Str(required=False, validate=validate.OneOf(USER_ROLES))
    availability_status = fields.Str(required=False, validate=validate.OneOf(AVAILABILITY_STATUSES))
    expertise_areas = fields.List(fields.Str(), required=False)
    is_active = fields.Bool(required=False)


class DashboardMetricsSchema(Schema):
    total_tickets = fields.Int()
    open_tickets = fields.Int()
    in_progress_tickets = fields.Int()
    resolved_tickets = fields.Int()
    closed_tickets = fields.Int()
    average_resolution_hours = fields.Float()
    tickets_by_priority = fields.Dict(keys=fields.Str(), values=fields.Int())
    tickets_by_category = fields.Dict(keys=fields.Str(), values=fields.Int())
    sla_compliance_rate = fields.Float()
    agent_performance = fields.List(fields.Dict())


class ReportExportSchema(Schema):
    report_type = fields.Str(required=True, validate=validate.OneOf(["tickets", "agents", "sla"]))
    format = fields.Str(load_default="csv", validate=validate.OneOf(["csv", "json"]))
    period = fields.Str(load_default="monthly", validate=validate.OneOf(["daily", "weekly", "monthly"]))


class SupportNotificationSchema(Schema):
    id = fields.Int(dump_only=True)
    ticket_id = fields.Int(allow_none=True)
    type = fields.Str()
    title = fields.Str()
    message = fields.Str()
    is_read = fields.Bool()
    created_at = fields.DateTime()


class NotificationPreferenceSchema(Schema):
    email_ticket_created = fields.Bool()
    email_ticket_assigned = fields.Bool()
    email_status_changed = fields.Bool()
    email_new_comment = fields.Bool()
    email_sla_warning = fields.Bool()
    in_app_enabled = fields.Bool()
