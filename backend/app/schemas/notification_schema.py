from marshmallow import Schema, fields

from app.extensions import ma
from app.models.notification import Notification


class NotificationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Notification
        load_instance = True
        include_fk = True


class NotificationQuerySchema(Schema):
    unread_only = fields.Boolean(load_default=False)


class UnreadCountSchema(Schema):
    count = fields.Integer(required=True)
