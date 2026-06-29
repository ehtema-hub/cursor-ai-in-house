"""Demo blog seed data — categories, authors, posts, and comments."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

DEMO_PASSWORD = "DemoPass123!"

DEMO_USERS = [
    ("maya@demo.local", "mayachen", "Maya Chen"),
    ("alex@demo.local", "alexrivera", "Alex Rivera"),
    ("sam@demo.local", "samortiz", "Sam Ortiz"),
    ("priya@demo.local", "priyanair", "Priya Nair"),
    ("jordan@demo.local", "jordanlee", "Jordan Lee"),
]

CATEGORIES = ["Technology", "Travel", "Food", "Lifestyle", "Programming"]

DEMO_POSTS = [
    {
        "username": "mayachen",
        "category": "Programming",
        "title": "Shipping our new Kanban board",
        "content": (
            "Just shipped the new onboarding wireframes! Really happy with how the "
            "step-by-step flow turned out. The drag-and-drop columns feel smooth and "
            "the task cards show enough context without clutter."
        ),
        "days_ago": 2,
        "comments": [
            ("alexrivera", "Love the column layout — much clearer than our old list view."),
            ("jordanlee", "Can we add swimlanes for assignees next sprint?"),
        ],
    },
    {
        "username": "alexrivera",
        "category": "Technology",
        "title": "Redis caching lessons from production",
        "content": (
            "We cut average API latency by 40% after caching paginated list endpoints. "
            "Key takeaway: invalidate on write, not on a fixed TTL alone. Happy to walk "
            "through our cache key strategy in the next eng sync."
        ),
        "days_ago": 4,
        "comments": [
            ("priyanair", "Would love a short doc on the invalidation pattern you used."),
        ],
    },
    {
        "username": "samortiz",
        "category": "Travel",
        "title": "Team offsite in Lisbon — highlights",
        "content": (
            "Three days of workshops, pasteis de nata, and a sunset walk along the "
            "Tagus. The retro format with sticky notes on the wall worked surprisingly "
            "well for remote folks joining over video."
        ),
        "days_ago": 6,
        "comments": [
            ("mayachen", "The waterfront dinner was the best team moment this quarter."),
            ("samortiz", "Already drafting ideas for next year's location vote."),
        ],
    },
    {
        "username": "priyanair",
        "category": "Food",
        "title": "Friday lunch club: vegetarian batch cooking",
        "content": (
            "This week we tried a big pot of coconut chickpea curry with rice. Prep took "
            "45 minutes for eight people and leftovers lasted through Monday. Recipe link "
            "in our shared doc — substitutions welcome!"
        ),
        "days_ago": 8,
        "comments": [
            ("jordanlee", "Please add the spice level notes — mine was mild but tasty."),
        ],
    },
    {
        "username": "jordanlee",
        "category": "Lifestyle",
        "title": "Async standups that actually work",
        "content": (
            "We moved to written standups in Slack with a simple template: yesterday, "
            "today, blockers. Meetings dropped from five per week to one. The trick was "
            "keeping posts under five sentences so people actually read them."
        ),
        "days_ago": 10,
        "comments": [
            ("alexrivera", "The blocker section alone saved us two escalation calls."),
            ("mayachen", "Sharing this with the design team — same pain point."),
        ],
    },
    {
        "username": "mayachen",
        "category": "Technology",
        "title": "Playwright POM structure for UI tests",
        "content": (
            "Page Object Model paid off once we hit eight E2E specs. Base page helpers "
            "for navigation and auth cut duplication in half. CI runs Chromium headless "
            "in under a minute on our preview build."
        ),
        "days_ago": 12,
        "comments": [],
    },
]


def _utc_days_ago(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def seed_blog_demo(db, User, Category, Post, Comment) -> None:
    """Seed categories, demo users, posts, and comments (idempotent)."""
    for name in CATEGORIES:
        if not Category.query.filter_by(name=name).first():
            db.session.add(Category(name=name))

    db.session.flush()

    users_by_username: dict[str, object] = {}
    for email, username, _display in DEMO_USERS:
        user = User.query.filter_by(username=username).first()
        if user is None:
            user = User(email=email, username=username)
            user.set_password(DEMO_PASSWORD)
            db.session.add(user)
        users_by_username[username] = user

    db.session.flush()

    if Post.query.count() > 0:
        db.session.commit()
        print("Demo posts already present — skipped post seeding.")
        return

    categories_by_name = {c.name: c for c in Category.query.all()}

    for entry in DEMO_POSTS:
        author = users_by_username[entry["username"]]
        category = categories_by_name[entry["category"]]
        created_at = _utc_days_ago(entry["days_ago"])

        post = Post(
            title=entry["title"],
            content=entry["content"],
            user_id=author.id,
            category_id=category.id,
            created_at=created_at,
            updated_at=created_at,
        )
        db.session.add(post)
        db.session.flush()

        for comment_username, content in entry.get("comments", []):
            comment_author = users_by_username[comment_username]
            db.session.add(
                Comment(
                    content=content,
                    user_id=comment_author.id,
                    post_id=post.id,
                    created_at=created_at + timedelta(hours=2),
                )
            )

    db.session.commit()
    print(f"Seeded {len(DEMO_POSTS)} demo posts with comments.")
