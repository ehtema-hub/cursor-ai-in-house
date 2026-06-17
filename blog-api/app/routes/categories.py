from flask import Blueprint, jsonify

from app.models import Category
from app.schemas import CategorySchema

categories_bp = Blueprint("categories", __name__, url_prefix="/api/categories")

category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)


@categories_bp.route("", methods=["GET"])
def list_categories():
    """List all blog categories
    ---
    tags:
      - Categories
    responses:
      200:
        description: List of categories
    """
    categories = Category.query.order_by(Category.name.asc()).all()
    return jsonify(categories_schema.dump(categories)), 200
