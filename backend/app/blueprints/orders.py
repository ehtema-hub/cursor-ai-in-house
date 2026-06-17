from decimal import Decimal

from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint, abort

from app.extensions import db
from app.models.order import ORDER_STATUSES, Order, OrderItem, generate_order_number
from app.models.product import Product
from app.schemas.commerce_schema import OrderCreateSchema, OrderSchema, OrderUpdateSchema
from app.support.errors import SupportAPIError
from app.support.rbac import get_current_user_required

blp = Blueprint(
    "orders",
    __name__,
    url_prefix="/api/orders",
    description="Order management",
)


def _get_order_or_404(order_id: int) -> Order:
    order = Order.query.get(order_id)
    if order is None:
        abort(404, message="Order not found.")
    return order


def _authorize_order_view(user, order: Order) -> None:
    if not user.is_admin and order.user_id != user.id:
        abort(403, message="Insufficient permissions.")


@blp.route("/")
class OrderList(MethodView):
    @jwt_required()
    @blp.response(200, OrderSchema(many=True))
    def get(self):
        """List orders for current user (admin sees all)."""
        user = get_current_user_required()
        query = Order.query
        if not user.is_admin:
            query = query.filter_by(user_id=user.id)
        return query.order_by(Order.created_at.desc()).all()

    @jwt_required()
    @blp.arguments(OrderCreateSchema)
    @blp.response(201, OrderSchema)
    def post(self, data):
        """Create order from line items."""
        user = get_current_user_required()
        items_data = data["items"]
        if not items_data:
            raise SupportAPIError(
                "Order must contain at least one item.",
                "VALIDATION_ERROR",
                400,
                {"items": ["At least one item is required."]},
            )

        order = Order(
            order_number=generate_order_number(),
            user_id=user.id,
            status="pending",
            total_amount=Decimal("0"),
        )
        db.session.add(order)
        db.session.flush()

        total = Decimal("0")
        for raw in items_data:
            product_id = raw.get("product_id")
            quantity = int(raw.get("quantity") or 0)
            if not product_id or quantity <= 0:
                raise SupportAPIError(
                    "Invalid order line item.",
                    "VALIDATION_ERROR",
                    400,
                    {"items": ["Each item requires product_id and positive quantity."]},
                )
            product = Product.query.get(int(product_id))
            if product is None or not product.is_active:
                abort(404, message=f"Product {product_id} not found.")
            if product.stock_quantity < quantity:
                raise SupportAPIError(
                    "Insufficient stock.",
                    "VALIDATION_ERROR",
                    400,
                    {"items": [f"Not enough stock for {product.sku}."]},
                )
            product.stock_quantity -= quantity
            line_total = Decimal(str(product.price)) * quantity
            total += line_total
            db.session.add(
                OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price,
                )
            )

        order.total_amount = total
        db.session.commit()
        return order


@blp.route("/<int:order_id>")
class OrderDetail(MethodView):
    @jwt_required()
    @blp.response(200, OrderSchema)
    def get(self, order_id):
        """Get order details."""
        user = get_current_user_required()
        order = _get_order_or_404(order_id)
        _authorize_order_view(user, order)
        return order

    @jwt_required()
    @blp.arguments(OrderUpdateSchema)
    @blp.response(200, OrderSchema)
    def put(self, data, order_id):
        """Update order status (admin only)."""
        user = get_current_user_required()
        if not user.is_admin:
            abort(403, message="Insufficient permissions.")
        order = _get_order_or_404(order_id)
        new_status = data["status"]
        if order.status == "cancelled" and new_status != "cancelled":
            raise SupportAPIError(
                "Cannot change status of cancelled order.",
                "VALIDATION_ERROR",
                400,
            )
        order.status = new_status
        db.session.commit()
        return order

    @jwt_required()
    @blp.response(204)
    def delete(self, order_id):
        """Cancel order (owner if pending, or admin)."""
        user = get_current_user_required()
        order = _get_order_or_404(order_id)
        if not user.is_admin and order.user_id != user.id:
            abort(403, message="Insufficient permissions.")
        if order.status not in ("pending", "confirmed"):
            raise SupportAPIError(
                "Only pending or confirmed orders can be cancelled.",
                "VALIDATION_ERROR",
                400,
            )
        order.status = "cancelled"
        db.session.commit()
        return ""
