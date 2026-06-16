from app.blueprints.auth import blp as auth_blp
from app.blueprints.notifications import blp as notifications_blp
from app.blueprints.projects import blp as projects_blp
from app.blueprints.support import admin_blp, agents_blp, tickets_blp
from app.blueprints.tasks import blp as tasks_blp
from app.blueprints.users import blp as users_blp


def register_blueprints(smorest_api) -> None:
    smorest_api.register_blueprint(auth_blp)
    smorest_api.register_blueprint(users_blp)
    smorest_api.register_blueprint(projects_blp)
    smorest_api.register_blueprint(tasks_blp)
    smorest_api.register_blueprint(notifications_blp)
    smorest_api.register_blueprint(tickets_blp)
    smorest_api.register_blueprint(agents_blp)
    smorest_api.register_blueprint(admin_blp)
