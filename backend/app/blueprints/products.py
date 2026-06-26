from decimal import Decimal

from flask.views import MethodView
from flask_jwt_extended import jwt_required
from flask_smorest import Blueprint, abort

from app.extensions import db
from app.schemas.commerce_schema import (
    ProductCreateSchema,
    ProductSchema,
    ProductUpdateSchema,
)
from app.models.product import Product
from app.support.rbac import get_current_user_required

blp = Blueprint(
    "products",
    __name__,
    url_prefix="/api/products",
    description="Product catalog",
)


@blp.route("/")
class ProductList(MethodView):
    @blp.response(200, ProductSchema(many=True))
    def get(self):
        """List active products (public)."""
        from flask import request

        query = Product.query.filter(Product.is_active.is_(True))
        cat = request.args.get("category")
        if cat:
            query = query.filter(Product.category == cat.lower())
        return query.order_by(Product.name.asc()).all()

    @jwt_required()
    @blp.arguments(ProductCreateSchema)
    @blp.response(201, ProductSchema)
    def post(self, data):
        """Create product (admin only)."""
        user = get_current_user_required()
        if not user.is_admin:
            abort(403, message="Insufficient permissions.")
        if Product.query.filter_by(sku=data["sku"]).first():
            abort(409, message="SKU already exists.")
        product = Product(
            sku=data["sku"].strip(),
            name=data["name"].strip(),
            description=(data.get("description") or "").strip(),
            price=Decimal(str(data["price"])),
            category=(data.get("category") or "general").lower(),
            stock_quantity=int(data.get("stock_quantity") or 0),
        )
        db.session.add(product)
        db.session.commit()
        return product


@blp.route("/<int:product_id>")
class ProductDetail(MethodView):
    @blp.response(200, ProductSchema)
    def get(self, product_id):
        """Get product by ID."""
        product = Product.query.get(product_id)
        if product is None or not product.is_active:
            abort(404, message="Product not found.")
        return product

    @jwt_required()
    @blp.arguments(ProductUpdateSchema)
    @blp.response(200, ProductSchema)
    def put(self, data, product_id):
        """Update product (admin only)."""
        user = get_current_user_required()
        if not user.is_admin:
            abort(403, message="Insufficient permissions.")
        product = Product.query.get(product_id)
        if product is None:
            abort(404, message="Product not found.")
        _apply_product_updates(product, data)
        db.session.commit()
        return product

    @jwt_required()
    @blp.response(204)
    def delete(self, product_id):
        """Soft-delete product (admin only)."""
        user = get_current_user_required()
        if not user.is_admin:
            abort(403, message="Insufficient permissions.")
        product = Product.query.get(product_id)
        if product is None:
            abort(404, message="Product not found.")
        product.is_active = False
        db.session.commit()
        return ""


def _apply_product_updates(product, data: dict) -> None:
    for key in ("name", "description", "category", "is_active"):
        if key in data and data[key] is not None:
            value = data[key].strip() if isinstance(data[key], str) else data[key]
            setattr(product, key, value)
    if "price" in data and data["price"] is not None:
        product.price = Decimal(str(data["price"]))
    if "stock_quantity" in data and data["stock_quantity"] is not None:
        product.stock_quantity = int(data["stock_quantity"])
