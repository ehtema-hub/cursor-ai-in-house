from app.extensions import db
from app.models.notification import Notification
from app.services.notifications import create_notification, get_unread_count


def test_unread_count_and_mark_read(client, owner_auth, owner):
    create_notification(
        user_id=owner.id,
        type="system",
        title="Hello",
        message="Test notification",
    )
    db.session.commit()

    first = client.get("/api/notifications/unread-count", headers=owner_auth)
    assert first.status_code == 200
    assert first.get_json()["count"] == 1

    second = client.get("/api/notifications/unread-count", headers=owner_auth)
    assert second.get_json()["count"] == 1

    notifications = client.get("/api/notifications/", headers=owner_auth)
    notification_id = notifications.get_json()[0]["id"]

    client.put(f"/api/notifications/{notification_id}/read", headers=owner_auth)
    after = client.get("/api/notifications/unread-count", headers=owner_auth)
    assert after.get_json()["count"] == 0


def test_mark_all_read(client, owner_auth, owner):
    for idx in range(3):
        create_notification(
            user_id=owner.id,
            type="system",
            title=f"N{idx}",
            message="Batch notification",
        )
    db.session.commit()

    response = client.put("/api/notifications/read-all", headers=owner_auth)
    assert response.status_code == 200
    assert get_unread_count(owner.id) == 0


def test_unread_only_filter(client, owner_auth, owner):
    create_notification(user_id=owner.id, type="system", title="Unread", message="One")
    note = create_notification(user_id=owner.id, type="system", title="Read", message="Two")
    note.is_read = True
    db.session.commit()

    response = client.get("/api/notifications/?unread_only=true", headers=owner_auth)
    assert response.status_code == 200
    assert all(not item["is_read"] for item in response.get_json())


def test_notification_stream_connects(client, owner_auth):
    response = client.get("/api/notifications/stream", headers=owner_auth)
    assert response.status_code == 200
    assert response.mimetype == "text/event-stream"
    chunk = next(response.response)
    assert b"connected" in chunk
