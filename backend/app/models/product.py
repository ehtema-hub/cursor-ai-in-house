from app.extensions import db
from app.models.mixins import TimestampMixin


class Product(db.Model, TimestampMixin):
    __tablename__ = "products"

    id = db.Column(db.Integer, primary_key=True)
    sku = db.Column(db.String(64), unique=True, nullable=False, index=True)
    name = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False, default="")
    price = db.Column(db.Numeric(10, 2), nullable=False)
    category = db.Column(db.String(80), nullable=False, index=True, default="general")
    stock_quantity = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    order_items = db.relationship("OrderItem", back_populates="product", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Product {self.sku}>"
