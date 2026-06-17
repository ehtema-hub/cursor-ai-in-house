import io
import re
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

import pytest

from app.extensions import db
from app.models.user import User
from app.support.models import SupportNotification, SupportTicket, TicketAssignment
from tests.conftest import auth_headers

TICKET_PAYLOAD = {
    "subject": "Login page not loading properly",
    "description": "When I try to access the login page, it shows a blank screen after submitting credentials.",
    "priority": "medium",
    "category": "technical",
    "customer_email": "customer@support.local",
}


@pytest.fixture
def customer_auth(client, support_users):
    return auth_headers(client, "customer@support.local", "CustomerPass123!")


@pytest.fixture
def admin_auth(client, support_users):
    return auth_headers(client, "admin@support.local", "AdminPass123!")


@pytest.fixture
def agent_auth(client, support_users):
    return auth_headers(client, "agent1@support.local", "AgentPass123!")


def _create_ticket(client, headers, auto_assign=False, **overrides):
    payload = {**TICKET_PAYLOAD, **overrides}
    url = "/api/tickets/?auto_assign=false" if not auto_assign else "/api/tickets/"
    return client.post(url, json=payload, headers=headers)


def test_fr001_create_ticket_with_validation(client, customer_auth):
    """FR-001: Ticket creation with required fields and validation."""
    response = _create_ticket(client, customer_auth, auto_assign=False)
    assert response.status_code == 201
    data = response.get_json()
    assert data["subject"] == TICKET_PAYLOAD["subject"]
    assert data["customer_email"] == "customer@support.local"

    invalid = client.post(
        "/api/tickets/?auto_assign=false",
        json={**TICKET_PAYLOAD, "subject": "Hi"},
        headers=customer_auth,
    )
    assert invalid.status_code == 400
    body = invalid.get_json()
    assert body["code"] == "VALIDATION_ERROR"
    assert "subject" in body["errors"]


def test_fr001_create_ticket_with_attachment(client, customer_auth, app):
    """FR-001: Optional attachments on ticket creation via multipart."""
    data = {
        "subject": TICKET_PAYLOAD["subject"],
        "description": TICKET_PAYLOAD["description"],
        "priority": "medium",
        "category": "technical",
        "customer_email": "customer@support.local",
    }
    file_data = (io.BytesIO(b"fake pdf content"), "screenshot.pdf")
    response = client.post(
        "/api/tickets/?auto_assign=false",
        data={**data, "file": file_data},
        content_type="multipart/form-data",
        headers=customer_auth,
    )
    assert response.status_code == 201
    ticket = response.get_json()
    assert len(ticket["attachments"]) == 1
    assert ticket["attachments"][0]["filename"] == "screenshot.pdf"


def test_fr002_ticket_number_format(client, customer_auth):
    """FR-002: Ticket numbers follow TICK-YYYYMMDD-XXXX format."""
    response = _create_ticket(client, customer_auth, auto_assign=False)
    assert response.status_code == 201
    ticket_number = response.get_json()["ticket_number"]
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    assert re.match(rf"^TICK-{today}-\d{{4}}$", ticket_number)


@patch("app.support.email_service.send_email")
def test_fr003_email_on_ticket_creation(mock_send, client, customer_auth):
    """FR-003: Email confirmation sent when ticket is created."""
    response = _create_ticket(client, customer_auth, auto_assign=False)
    assert response.status_code == 201
    mock_send.assert_called()
    args = mock_send.call_args[0]
    assert args[0] == "customer@support.local"
    assert "created" in args[1].lower()


def test_fr004_ticket_starts_open(client, customer_auth):
    """FR-004: New tickets start with status 'open'."""
    response = _create_ticket(client, customer_auth, auto_assign=False)
    assert response.status_code == 201
    assert response.get_json()["status"] == "open"


def test_fr005_manual_assignment_by_admin(client, customer_auth, admin_auth, support_users):
    """FR-005: Admin can manually assign tickets to agents."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()

    assign = client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id, "note": "Manual assignment for testing"},
        headers=admin_auth,
    )
    assert assign.status_code == 200
    data = assign.get_json()
    assert data["assigned_to_id"] == agent.id
    assert data["status"] == "assigned"


def test_fr006_auto_assignment_on_create(client, customer_auth, support_users):
    """FR-006: Tickets auto-assigned based on workload and expertise."""
    response = client.post(
        "/api/tickets/",
        json={**TICKET_PAYLOAD, "category": "technical"},
        headers=customer_auth,
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["assigned_to_id"] is not None
    agent = User.query.get(data["assigned_to_id"])
    assert agent.role == "agent"
    assert "technical" in agent.get_expertise_areas()


@patch("app.support.email_service.send_email")
def test_fr007_email_on_assignment(mock_send, client, customer_auth, admin_auth, support_users):
    """FR-007: Agent receives email when ticket is assigned."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()
    mock_send.reset_mock()

    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=admin_auth,
    )
    recipients = [call[0][0] for call in mock_send.call_args_list]
    assert agent.email in recipients


def test_fr008_status_assigned_on_assignment(client, customer_auth, admin_auth, support_users):
    """FR-008: Status changes to 'assigned' when ticket is assigned."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()

    assign = client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=admin_auth,
    )
    assert assign.get_json()["status"] == "assigned"


def test_fr009_admin_reassignment(client, customer_auth, admin_auth, support_users):
    """FR-009: Admin can reassign tickets to different agents."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent1 = User.query.filter_by(email="agent1@support.local").first()
    agent2 = User.query.filter_by(email="agent2@support.local").first()

    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent1.id},
        headers=admin_auth,
    )
    reassign = client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent2.id, "note": "Reassigned to agent two"},
        headers=admin_auth,
    )
    assert reassign.status_code == 200
    assert reassign.get_json()["assigned_to_id"] == agent2.id


def test_fr010_assignment_history(client, customer_auth, admin_auth, support_users):
    """FR-010: Assignment history is tracked."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent1 = User.query.filter_by(email="agent1@support.local").first()
    agent2 = User.query.filter_by(email="agent2@support.local").first()

    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent1.id},
        headers=admin_auth,
    )
    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent2.id},
        headers=admin_auth,
    )

    detail = client.get(f"/api/tickets/{ticket_id}", headers=admin_auth)
    assignments = detail.get_json()["assignments"]
    assert len(assignments) == 2
    assert assignments[-1]["assigned_to_id"] == agent2.id


def test_fr011_fr012_status_transitions(client, customer_auth, admin_auth, agent_auth, support_users):
    """FR-011/012: Valid status transitions allowed; invalid ones rejected."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()
    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=admin_auth,
    )

    valid = client.put(
        f"/api/tickets/{ticket_id}/status",
        json={"status": "in_progress"},
        headers=agent_auth,
    )
    assert valid.status_code == 200
    assert valid.get_json()["status"] == "in_progress"

    invalid = client.put(
        f"/api/tickets/{ticket_id}/status",
        json={"status": "open"},
        headers=agent_auth,
    )
    assert invalid.status_code == 400
    assert invalid.get_json()["code"] == "VALIDATION_ERROR"


def test_fr013_status_history_logged(client, customer_auth, admin_auth, agent_auth, support_users):
    """FR-013: Status changes are logged in history."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()
    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=admin_auth,
    )
    client.put(
        f"/api/tickets/{ticket_id}/status",
        json={"status": "in_progress", "note": "Started working"},
        headers=agent_auth,
    )

    history = client.get(f"/api/tickets/{ticket_id}/history", headers=admin_auth)
    assert history.status_code == 200
    entries = history.get_json()
    statuses = [(e["from_status"], e["to_status"]) for e in entries]
    assert (None, "open") in statuses
    assert ("open", "assigned") in statuses
    assert ("assigned", "in_progress") in statuses


def test_fr014_notification_on_status_change(client, customer_auth, admin_auth, agent_auth, support_users):
    """FR-014: Customer receives in-app notification on status change."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()
    customer = User.query.filter_by(email="customer@support.local").first()

    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=admin_auth,
    )
    SupportNotification.query.filter_by(user_id=customer.id, type="status_changed").delete()
    db.session.commit()

    client.put(
        f"/api/tickets/{ticket_id}/status",
        json={"status": "in_progress"},
        headers=agent_auth,
    )

    notification = SupportNotification.query.filter_by(
        user_id=customer.id, ticket_id=ticket_id, type="status_changed"
    ).first()
    assert notification is not None
    assert "in_progress" in notification.message


def test_fr015_comments_by_customer_and_agent(client, customer_auth, admin_auth, agent_auth, support_users):
    """FR-015: Customers and agents can add comments; internal notes hidden from customers."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()
    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=admin_auth,
    )

    customer_comment = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={"content": "Thanks, I am waiting for an update on this issue."},
        headers=customer_auth,
    )
    assert customer_comment.status_code == 201

    internal_comment = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={"content": "Internal note: checking server logs.", "is_internal": True},
        headers=agent_auth,
    )
    assert internal_comment.status_code == 201

    agent_comment = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={"content": "We are investigating the login issue now."},
        headers=agent_auth,
    )
    assert agent_comment.status_code == 201

    customer_view = client.get(f"/api/tickets/{ticket_id}/comments", headers=customer_auth)
    assert customer_view.status_code == 200
    comments = customer_view.get_json()
    assert len(comments) == 2
    assert all(not c["is_internal"] for c in comments)

    agent_view = client.get(f"/api/tickets/{ticket_id}/comments", headers=agent_auth)
    assert len(agent_view.get_json()) == 3


def test_customer_cannot_add_internal_comment(client, customer_auth, support_users):
    """Security: Customers cannot create internal comments."""
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    response = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={"content": "Trying to add internal note.", "is_internal": True},
        headers=customer_auth,
    )
    assert response.status_code == 403


def test_customer_cannot_view_other_tickets(client, customer_auth, admin_auth, support_users):
    """Security: Customers can only view their own tickets."""
    outsider = User(name="Other Customer", email="other@test.local", role="customer")
    outsider.set_password("OtherPass123!")
    db.session.add(outsider)
    db.session.commit()
    other_auth = auth_headers(client, "other@test.local", "OtherPass123!")

    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]

    response = client.get(f"/api/tickets/{ticket_id}", headers=other_auth)
    assert response.status_code == 403


def test_unauthenticated_access_denied(client, support_users):
    """Security: Unauthenticated requests are rejected."""
    response = client.get("/api/tickets/")
    assert response.status_code == 401


def _assigned_ticket(client, customer_auth, admin_auth):
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()
    client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=admin_auth,
    )
    return ticket_id, agent


def test_validation_rejects_invalid_fields(client, customer_auth):
    cases = [
        {**TICKET_PAYLOAD, "description": "too short"},
        {**TICKET_PAYLOAD, "customer_email": "not-an-email"},
        {**TICKET_PAYLOAD, "category": "invalid_category"},
        {**TICKET_PAYLOAD, "priority": "critical"},
    ]
    for payload in cases:
        response = client.post(
            "/api/tickets/?auto_assign=false",
            json=payload,
            headers=customer_auth,
        )
        assert response.status_code == 400
        assert response.get_json()["code"] == "VALIDATION_ERROR"


def test_list_tickets_with_filters(client, customer_auth, admin_auth):
    _create_ticket(client, customer_auth, auto_assign=False)
    response = client.get(
        "/api/tickets/?q=Login&status=open&priority=medium&category=technical",
        headers=admin_auth,
    )
    assert response.status_code == 200
    body = response.get_json()
    assert body["meta"]["total"] >= 1


def test_update_ticket_subject(client, customer_auth):
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    response = client.put(
        f"/api/tickets/{ticket_id}",
        json={"subject": "Updated login issue subject line"},
        headers=customer_auth,
    )
    assert response.status_code == 200
    assert response.get_json()["subject"] == "Updated login issue subject line"


def test_admin_delete_ticket(client, customer_auth, admin_auth):
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    response = client.delete(f"/api/tickets/{ticket_id}", headers=admin_auth)
    assert response.status_code == 204
    assert SupportTicket.query.get(ticket_id) is None


def test_priority_update_requires_reason(client, customer_auth, admin_auth, agent_auth):
    ticket_id, _ = _assigned_ticket(client, customer_auth, admin_auth)
    bad = client.put(
        f"/api/tickets/{ticket_id}/priority",
        json={"priority": "high", "reason": "no"},
        headers=agent_auth,
    )
    assert bad.status_code == 400

    good = client.put(
        f"/api/tickets/{ticket_id}/priority",
        json={"priority": "high", "reason": "Customer escalation requested"},
        headers=agent_auth,
    )
    assert good.status_code == 200
    assert good.get_json()["priority"] == "high"


def test_assign_forbidden_for_customer(client, customer_auth, admin_auth, agent_auth):
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    agent = User.query.filter_by(email="agent1@support.local").first()
    assert client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=customer_auth,
    ).status_code == 403
    assert client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"assigned_to_id": agent.id},
        headers=agent_auth,
    ).status_code == 403


def test_auto_assign_via_endpoint(client, customer_auth, admin_auth):
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    response = client.post(
        f"/api/tickets/{ticket_id}/assign",
        json={"auto_assign": True},
        headers=admin_auth,
    )
    assert response.status_code == 200
    assert response.get_json()["assigned_to_id"] is not None


def test_resolve_and_close_workflow(client, customer_auth, admin_auth, agent_auth):
    ticket_id, _ = _assigned_ticket(client, customer_auth, admin_auth)
    for status in ("in_progress", "resolved", "closed"):
        response = client.put(
            f"/api/tickets/{ticket_id}/status",
            json={"status": status},
            headers=agent_auth,
        )
        assert response.status_code == 200


def test_customer_can_reopen_closed_ticket(client, customer_auth, admin_auth, agent_auth):
    ticket_id, _ = _assigned_ticket(client, customer_auth, admin_auth)
    for status in ("in_progress", "resolved", "closed"):
        client.put(
            f"/api/tickets/{ticket_id}/status",
            json={"status": status},
            headers=agent_auth,
        )
    ticket = SupportTicket.query.get(ticket_id)
    ticket.closed_at = datetime.now(timezone.utc) - timedelta(days=1)
    db.session.commit()
    reopened = client.put(
        f"/api/tickets/{ticket_id}/status",
        json={"status": "reopened"},
        headers=customer_auth,
    )
    assert reopened.status_code == 200
    assert reopened.get_json()["status"] == "reopened"


def test_invalid_attachment_type(client, customer_auth):
    create = _create_ticket(client, customer_auth, auto_assign=False)
    ticket_id = create.get_json()["id"]
    file_data = (io.BytesIO(b"executable"), "malware.exe")
    response = client.post(
        f"/api/tickets/{ticket_id}/attachments",
        data={"file": file_data},
        content_type="multipart/form-data",
        headers=customer_auth,
    )
    assert response.status_code == 400


def test_agents_list_and_availability(client, admin_auth, agent_auth):
    agents = client.get("/api/agents/", headers=admin_auth)
    assert agents.status_code == 200
    agent = User.query.filter_by(email="agent1@support.local").first()
    updated = client.put(
        f"/api/agents/{agent.id}/availability",
        json={"availability_status": "busy"},
        headers=agent_auth,
    )
    assert updated.status_code == 200
    assert updated.get_json()["availability_status"] == "busy"


def test_admin_dashboard_and_reports(client, customer_auth, admin_auth):
    _create_ticket(client, customer_auth, auto_assign=False)
    dashboard = client.get("/api/admin/dashboard", headers=admin_auth)
    assert dashboard.status_code == 200
    for path in ("/api/admin/reports/tickets", "/api/admin/reports/agents", "/api/admin/reports/sla"):
        assert client.get(path, headers=admin_auth).status_code == 200


def test_ticket_export_csv(client, customer_auth, admin_auth):
    _create_ticket(client, customer_auth, auto_assign=False)
    response = client.get("/api/tickets/export", headers=admin_auth)
    assert response.status_code == 200
    assert "text/csv" in response.content_type


def test_ticket_not_found(client, admin_auth):
    response = client.get("/api/tickets/99999", headers=admin_auth)
    assert response.status_code == 404
