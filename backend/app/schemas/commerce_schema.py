from marshmallow import Schema, fields, validate

from app.extensions import ma
from app.models.order import ORDER_STATUSES, Order, OrderItem
from app.models.product import Product


class ProductSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Product
        load_instance = True
        include_fk = True


class ProductCreateSchema(Schema):
    sku = fields.String(required=True, validate=validate.Length(min=2, max=64))
    name = fields.String(required=True, validate=validate.Length(min=2, max=200))
    description = fields.String(load_default="")
    price = fields.Decimal(required=True, as_string=True, validate=validate.Range(min=0.01))
    category = fields.String(load_default="general", validate=validate.Length(max=80))
    stock_quantity = fields.Integer(load_default=0, validate=validate.Range(min=0))


class ProductUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=200))
    description = fields.String()
    price = fields.Decimal(as_string=True, validate=validate.Range(min=0.01))
    category = fields.String(validate=validate.Length(max=80))
    stock_quantity = fields.Integer(validate=validate.Range(min=0))
    is_active = fields.Boolean()


class OrderItemSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = OrderItem
        load_instance = True
        include_fk = True

    product = fields.Nested(ProductSchema, dump_only=True)


class OrderSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Order
        load_instance = True
        include_fk = True

    items = fields.Nested(OrderItemSchema, many=True, dump_only=True)


class OrderCreateSchema(Schema):
    items = fields.List(
        fields.Dict(keys=fields.String(), values=fields.Raw()),
        required=True,
        validate=validate.Length(min=1),
    )


class OrderUpdateSchema(Schema):
    status = fields.String(required=True, validate=validate.OneOf(ORDER_STATUSES))


class UpdateSelfUserSchema(Schema):
    name = fields.String(validate=validate.Length(min=2, max=120))
    email = fields.Email()
