USER_ROLES = ("customer", "agent", "admin")
AVAILABILITY_STATUSES = ("available", "busy", "offline")

TICKET_STATUSES = (
    "open",
    "assigned",
    "in_progress",
    "waiting",
    "resolved",
    "closed",
    "reopened",
)
TICKET_PRIORITIES = ("low", "medium", "high", "urgent")
TICKET_CATEGORIES = ("technical", "billing", "general", "feature_request")

ALLOWED_ATTACHMENT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"}
MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024  # 5MB
MAX_ATTACHMENTS_PER_TICKET = 3

STATUS_TRANSITIONS: dict[str, set[str]] = {
    "open": {"assigned", "closed"},
    "assigned": {"in_progress", "closed"},
    "in_progress": {"waiting", "resolved", "closed"},
    "waiting": {"in_progress"},
    "resolved": {"closed", "reopened"},
    "closed": {"reopened"},
    "reopened": {"in_progress"},
}

REOPEN_WINDOW_DAYS = 7

SLA_RESPONSE_HOURS = {
    "urgent": 2,
    "high": 4,
    "medium": 8,
    "low": 24,
}

SLA_RESOLUTION_HOURS = {
    "urgent": 24,
    "high": 48,
    "medium": 120,  # 5 days
    "low": 240,  # 10 days
}

SUBJECT_PATTERN = r"^[a-zA-Z0-9\s\.,!?'\-:;()]+$"
