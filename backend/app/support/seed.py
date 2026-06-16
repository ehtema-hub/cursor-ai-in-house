"""Seed support system users for development and testing."""

from app.extensions import db
from app.models.user import User


def seed_support_users() -> None:
    seeds = [
        {
            "name": "Support Admin",
            "email": "admin@support.local",
            "password": "AdminPass123!",
            "role": "admin",
        },
        {
            "name": "Agent One",
            "email": "agent1@support.local",
            "password": "AgentPass123!",
            "role": "agent",
            "availability_status": "available",
            "expertise_areas": ["technical", "billing"],
        },
        {
            "name": "Agent Two",
            "email": "agent2@support.local",
            "password": "AgentPass123!",
            "role": "agent",
            "availability_status": "available",
            "expertise_areas": ["general", "feature_request"],
        },
        {
            "name": "Customer Demo",
            "email": "customer@support.local",
            "password": "CustomerPass123!",
            "role": "customer",
        },
    ]

    for item in seeds:
        existing = User.query.filter_by(email=item["email"]).first()
        if existing:
            continue
        user = User(
            name=item["name"],
            email=item["email"],
            role=item["role"],
            availability_status=item.get("availability_status", "available"),
            expertise_areas=item.get("expertise_areas", []),
        )
        user.set_password(item["password"])
        db.session.add(user)

    db.session.commit()
