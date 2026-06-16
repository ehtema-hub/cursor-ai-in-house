import re
from datetime import datetime, timezone

from app.support.constants import (
    SUBJECT_PATTERN,
    TICKET_CATEGORIES,
    TICKET_PRIORITIES,
    TICKET_STATUSES,
)
from app.support.errors import SupportAPIError
from app.support.rbac import sanitize_text, validate_email_format


def validate_ticket_create(data: dict) -> dict:
    errors: dict[str, list[str]] = {}

    subject = (data.get("subject") or "").strip()
    if len(subject) < 5:
        errors.setdefault("subject", []).append("Subject must be at least 5 characters.")
    elif len(subject) > 200:
        errors.setdefault("subject", []).append("Subject must not exceed 200 characters.")
    elif not re.match(SUBJECT_PATTERN, subject):
        errors.setdefault("subject", []).append(
            "Subject may only contain alphanumeric characters and common punctuation."
        )

    description = (data.get("description") or "").strip()
    if len(description) < 20:
        errors.setdefault("description", []).append("Description must be at least 20 characters.")
    elif len(description) > 5000:
        errors.setdefault("description", []).append("Description must not exceed 5000 characters.")

    email = (data.get("customer_email") or "").strip().lower()
    if not email:
        errors.setdefault("customer_email", []).append("Customer email is required.")
    elif not validate_email_format(email):
        errors.setdefault("customer_email", []).append("Invalid email format.")

    priority = (data.get("priority") or "medium").lower()
    if priority not in TICKET_PRIORITIES:
        errors.setdefault("priority", []).append(
            f"Priority must be one of: {', '.join(TICKET_PRIORITIES)}."
        )

    category = (data.get("category") or "").lower().replace(" ", "_")
    if category == "feature_request" or category == "feature request":
        category = "feature_request"
    if category not in TICKET_CATEGORIES:
        errors.setdefault("category", []).append(
            f"Category must be one of: {', '.join(TICKET_CATEGORIES)}."
        )

    if errors:
        raise SupportAPIError("Input validation failed.", "VALIDATION_ERROR", 400, errors)

    return {
        "subject": sanitize_text(subject),
        "description": sanitize_text(description),
        "customer_email": email,
        "priority": priority,
        "category": category,
    }


def validate_ticket_update(data: dict) -> dict:
    errors: dict[str, list[str]] = {}
    cleaned: dict = {}

    if "subject" in data and data["subject"] is not None:
        subject = data["subject"].strip()
        if len(subject) < 5 or len(subject) > 200:
            errors.setdefault("subject", []).append("Subject must be between 5 and 200 characters.")
        elif not re.match(SUBJECT_PATTERN, subject):
            errors.setdefault("subject", []).append("Subject contains invalid characters.")
        else:
            cleaned["subject"] = sanitize_text(subject)

    if "description" in data and data["description"] is not None:
        description = data["description"].strip()
        if len(description) < 20 or len(description) > 5000:
            errors.setdefault("description", []).append(
                "Description must be between 20 and 5000 characters."
            )
        else:
            cleaned["description"] = sanitize_text(description)

    if errors:
        raise SupportAPIError("Input validation failed.", "VALIDATION_ERROR", 400, errors)
    return cleaned


def validate_status_update(status: str) -> str:
    status = (status or "").lower().replace(" ", "_")
    if status not in TICKET_STATUSES:
        raise SupportAPIError(
            f"Invalid status. Must be one of: {', '.join(TICKET_STATUSES)}.",
            "VALIDATION_ERROR",
            400,
            {"status": ["Invalid ticket status."]},
        )
    return status


def validate_priority_update(priority: str, reason: str | None) -> tuple[str, str]:
    priority = (priority or "").lower()
    if priority not in TICKET_PRIORITIES:
        raise SupportAPIError(
            "Invalid priority level.",
            "VALIDATION_ERROR",
            400,
            {"priority": [f"Must be one of: {', '.join(TICKET_PRIORITIES)}."]},
        )
    reason = (reason or "").strip()
    if len(reason) < 5:
        raise SupportAPIError(
            "Priority change requires a reason (minimum 5 characters).",
            "VALIDATION_ERROR",
            400,
            {"reason": ["Reason is required when changing priority."]},
        )
    return priority, sanitize_text(reason)


def validate_comment_content(content: str) -> str:
    content = (content or "").strip()
    if len(content) < 1:
        raise SupportAPIError(
            "Comment content is required.",
            "VALIDATION_ERROR",
            400,
            {"content": ["Comment cannot be empty."]},
        )
    if len(content) > 5000:
        raise SupportAPIError(
            "Comment is too long.",
            "VALIDATION_ERROR",
            400,
            {"content": ["Comment must not exceed 5000 characters."]},
        )
    return sanitize_text(content)


def parse_date_param(value: str | None, field_name: str) -> datetime | None:
    if not value:
        return None
    try:
        if "T" in value:
            dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        else:
            dt = datetime.strptime(value, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except ValueError as exc:
        raise SupportAPIError(
            f"Invalid date format for {field_name}.",
            "VALIDATION_ERROR",
            400,
            {field_name: ["Use ISO 8601 or YYYY-MM-DD format."]},
        ) from exc
