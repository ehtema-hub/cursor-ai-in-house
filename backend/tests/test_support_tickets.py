import pytest

from app.support.seed import seed_support_users


@pytest.fixture
def support_users(app):
    with app.app_context():
        seed_support_users()
