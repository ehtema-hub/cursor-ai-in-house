"""Add performance indexes for tasks and notifications."""

from alembic import op


revision = "b8e2f1a4c9d0"
down_revision = "54755819609c"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.create_index("ix_tasks_project_status", ["project_id", "status"], unique=False)
        batch_op.create_index("ix_tasks_project_created", ["project_id", "created_at"], unique=False)
        batch_op.create_index("ix_tasks_assignee_status", ["assignee_id", "status"], unique=False)
        batch_op.create_index("ix_tasks_priority", ["priority"], unique=False)

    with op.batch_alter_table("notifications", schema=None) as batch_op:
        batch_op.create_index("ix_notifications_user_unread", ["user_id", "is_read"], unique=False)
        batch_op.create_index("ix_notifications_user_created", ["user_id", "created_at"], unique=False)


def downgrade():
    with op.batch_alter_table("notifications", schema=None) as batch_op:
        batch_op.drop_index("ix_notifications_user_created")
        batch_op.drop_index("ix_notifications_user_unread")

    with op.batch_alter_table("tasks", schema=None) as batch_op:
        batch_op.drop_index("ix_tasks_priority")
        batch_op.drop_index("ix_tasks_assignee_status")
        batch_op.drop_index("ix_tasks_project_created")
        batch_op.drop_index("ix_tasks_project_status")
