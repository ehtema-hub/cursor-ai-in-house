from datetime import datetime, timezone

from app.extensions import db
from app.models.mixins import TimestampMixin

ORDER_STATUSES = ("pending", "confirmed", "shipped", "cancelled")


class Order(db.Model, TimestampMixin):
    __tablename__ = "orders"

    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(32), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    status = db.Column(db.String(20), nullable=False, default="pending", index=True)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)

    user = db.relationship("User", backref=db.backref("orders", lazy="dynamic"))
    items = db.relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="joined",
    )

    def __repr__(self) -> str:
        return f"<Order {self.order_number}>"


class OrderItem(db.Model):
    __tablename__ = "order_items"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.id"), nullable=False, index=True)
    product_id = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False, index=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)

    order = db.relationship("Order", back_populates="items")
    product = db.relationship("Product", back_populates="order_items")


def generate_order_number() -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    count = Order.query.filter(Order.order_number.like(f"ORD-{today}-%")).count() + 1
    return f"ORD-{today}-{count:04d}"
