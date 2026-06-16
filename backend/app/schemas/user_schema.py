from marshmallow import Schema, fields, validate

from app.extensions import ma
from app.models.project import Project, ProjectMember
from app.models.task import TASK_PRIORITIES, TASK_STATUSES, Task
from app.models.user import User


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        include_fk = True
        exclude = ("password_hash",)


class RegisterSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=120))
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class TokenSchema(Schema):
    access_token = fields.String(required=True)
    refresh_token = fields.String(required=True)


class MessageSchema(Schema):
    message = fields.String(required=True)


class ProjectSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        load_instance = True
        include_fk = True

    task_count = fields.Method("get_task_count")
    member_count = fields.Method("get_member_count")

    def get_task_count(self, obj):
        return len(obj.tasks) if obj.tasks else 0

    def get_member_count(self, obj):
        return len(obj.members) if obj.members else 0


class ProjectCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    description = fields.String(load_default="")


class ProjectUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    description = fields.String()


class ProjectMemberSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ProjectMember
        load_instance = True
        include_fk = True

    user = fields.Nested(UserSchema, dump_only=True)


class AddMemberSchema(Schema):
    email = fields.Email(required=True)
    role = fields.String(
        load_default="member",
        validate=validate.OneOf(["admin", "member"]),
    )


class TaskSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Task
        load_instance = True
        include_fk = True

    assignee = fields.Nested(UserSchema, dump_only=True)
    creator = fields.Nested(UserSchema, dump_only=True)


class TaskCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=255))
    description = fields.String(load_default="")
    status = fields.String(
        load_default="todo",
        validate=validate.OneOf(TASK_STATUSES),
    )
    priority = fields.String(
        load_default="medium",
        validate=validate.OneOf(TASK_PRIORITIES),
    )
    due_date = fields.DateTime(allow_none=True)
    project_id = fields.Integer(required=True)
    assignee_id = fields.Integer(allow_none=True)


class TaskUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=255))
    description = fields.String()
    status = fields.String(validate=validate.OneOf(TASK_STATUSES))
    priority = fields.String(validate=validate.OneOf(TASK_PRIORITIES))
    due_date = fields.DateTime(allow_none=True)
    assignee_id = fields.Integer(allow_none=True)


class TaskQuerySchema(Schema):
    project_id = fields.Integer()
    status = fields.String(validate=validate.OneOf(TASK_STATUSES))
    assignee_id = fields.Integer()
    priority = fields.String(validate=validate.OneOf(TASK_PRIORITIES))
