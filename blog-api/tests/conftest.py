import pytest

from app import create_app
from app.extensions import db
from app.models import Category, Post, User
from app.services.cache import cache


@pytest.fixture
def app():
    application = create_app("testing")
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture(autouse=True)
def reset_cache(app):
    cache.flush_all()
    if app.config.get("CACHE_USE_FAKE_REDIS"):
        cache.use_fake_redis()
    yield
    cache.flush_all()


@pytest.fixture
def category(app):
    cat = Category(name="Technology")
    db.session.add(cat)
    db.session.commit()
    return cat


@pytest.fixture
def author(app):
    user = User(email="author@blog.local", username="author")
    user.set_password("SecurePass123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def other_user(app):
    user = User(email="other@blog.local", username="other")
    user.set_password("SecurePass123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def author_headers(client, author):
    response = client.post(
        "/api/auth/login",
        json={"email": author.email, "password": "SecurePass123!"},
    )
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def other_headers(client, other_user):
    response = client.post(
        "/api/auth/login",
        json={"email": other_user.email, "password": "SecurePass123!"},
    )
    token = response.get_json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_post(app, author, category):
    post = Post(
        title="Sample Cached Post",
        content="A sufficiently long sample post body for testing purposes.",
        user_id=author.id,
        category_id=category.id,
    )
    db.session.add(post)
    db.session.commit()
    return post


@pytest.fixture
def many_posts(app, author, category):
    posts = []
    for idx in range(25):
        post = Post(
            title=f"Bulk Post {idx:02d}",
            content=f"Content for bulk post number {idx} used in pagination tests.",
            user_id=author.id,
            category_id=category.id,
        )
        db.session.add(post)
        posts.append(post)
    db.session.commit()
    return posts
