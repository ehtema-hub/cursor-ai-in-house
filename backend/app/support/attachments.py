import os
import uuid
from pathlib import Path

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.extensions import db
from app.support.constants import (
    ALLOWED_ATTACHMENT_EXTENSIONS,
    MAX_ATTACHMENT_SIZE,
    MAX_ATTACHMENTS_PER_TICKET,
)
from app.support.errors import SupportAPIError
from app.support.models import TicketAttachment


def _upload_dir() -> Path:
    base = current_app.config.get("UPLOAD_FOLDER", "uploads")
    path = Path(base)
    path.mkdir(parents=True, exist_ok=True)
    return path


def validate_attachment_file(file: FileStorage) -> None:
    if not file or not file.filename:
        raise SupportAPIError(
            "Invalid attachment file.",
            "VALIDATION_ERROR",
            400,
            {"attachment": ["File is required."]},
        )

    filename = secure_filename(file.filename)
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_ATTACHMENT_EXTENSIONS:
        raise SupportAPIError(
            "Invalid file type.",
            "VALIDATION_ERROR",
            400,
            {"attachment": [f"Allowed types: {', '.join(sorted(ALLOWED_ATTACHMENT_EXTENSIONS))}."]},
        )

    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_ATTACHMENT_SIZE:
        raise SupportAPIError(
            "File too large.",
            "VALIDATION_ERROR",
            400,
            {"attachment": ["Maximum file size is 5MB."]},
        )


def save_attachment(ticket_id: int, file: FileStorage, comment_id: int | None = None) -> TicketAttachment:
    existing_count = TicketAttachment.query.filter_by(ticket_id=ticket_id).count()
    if existing_count >= MAX_ATTACHMENTS_PER_TICKET:
        raise SupportAPIError(
            "Maximum attachments reached.",
            "VALIDATION_ERROR",
            400,
            {"attachment": [f"Maximum {MAX_ATTACHMENTS_PER_TICKET} attachments per ticket."]},
        )

    validate_attachment_file(file)
    original_name = secure_filename(file.filename)
    ext = os.path.splitext(original_name)[1].lower()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    upload_path = _upload_dir() / stored_name

    file.save(upload_path)
    file.seek(0, os.SEEK_END)
    size = file.tell()

    attachment = TicketAttachment(
        ticket_id=ticket_id,
        comment_id=comment_id,
        filename=original_name,
        stored_filename=stored_name,
        file_path=str(upload_path),
        file_size=size,
        file_type=file.content_type or "application/octet-stream",
    )
    db.session.add(attachment)
    return attachment
