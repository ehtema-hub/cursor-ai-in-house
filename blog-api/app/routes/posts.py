from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import jwt_required
from marshmallow import ValidationError
from sqlalchemy import or_

from app.extensions import db
from app.models import Category, Comment, Post
from app.schemas import (
    CommentCreateSchema,
    CommentSchema,
    PaginatedPostsSchema,
    PostCreateSchema,
    PostSchema,
    PostUpdateSchema,
)
from app.services.post_service import (
    bust_caches_after_create,
    bust_caches_after_delete,
    bust_caches_after_update,
    fetch_paginated_posts,
    fetch_post_detail,
)
from app.utils.auth_helpers import get_current_user

posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")
search_bp = Blueprint("search", __name__, url_prefix="/api")

post_schema = PostSchema()
posts_schema = PostSchema(many=True)
comment_schema = CommentSchema()
comments_schema = CommentSchema(many=True)
post_create_schema = PostCreateSchema()
post_update_schema = PostUpdateSchema()
comment_create_schema = CommentCreateSchema()
paginated_posts_schema = PaginatedPostsSchema()


def _pagination_meta(pagination):
    return {
        "total": pagination.total,
        "pages": pagination.pages,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "next_page": pagination.page + 1 if pagination.has_next else None,
        "prev_page": pagination.page - 1 if pagination.has_prev else None,
    }


def _paginate_query(query):
    page = request.args.get("page", 1, type=int)
    page = max(page, 1)
    per_page = current_app.config["POSTS_PER_PAGE"]
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        "items": pagination.items,
        "meta": _pagination_meta(pagination),
    }


@posts_bp.route("", methods=["GET"])
def list_posts():
    """List all blog posts (paginated, Redis-cached)
    ---
    tags:
      - Posts
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
        description: Page number (20 posts per page)
    responses:
      200:
        description: Paginated list of posts
    """
    page = request.args.get("page", 1, type=int)
    payload, _from_cache = fetch_paginated_posts(page)
    return jsonify(payload), 200


@posts_bp.route("", methods=["POST"])
@jwt_required()
def create_post():
    """Create a new blog post
    ---
    tags:
      - Posts
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - title
            - content
            - category_id
          properties:
            title:
              type: string
              example: My First Post
            content:
              type: string
              example: This is the full body content of the blog post.
            category_id:
              type: integer
              example: 1
    responses:
      201:
        description: Post created
      400:
        description: Validation error
      401:
        description: Unauthorized
      404:
        description: Category not found
    """
    user = get_current_user()
    try:
        data = post_create_schema.load(request.get_json() or {})
    except ValidationError as err:
        raise err

    category = db.session.get(Category, data["category_id"])
    if category is None:
        return jsonify({"error": "Category not found."}), 404

    post = Post(
        title=data["title"].strip(),
        content=data["content"].strip(),
        user_id=user.id,
        category_id=category.id,
    )
    db.session.add(post)
    db.session.commit()
    bust_caches_after_create()
    return jsonify(post_schema.dump(post)), 201


@posts_bp.route("/<int:post_id>", methods=["GET"])
def get_post(post_id):
    """Get a single blog post by ID (Redis-cached)
    ---
    tags:
      - Posts
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: Post details
      404:
        description: Post not found
    """
    payload, _from_cache = fetch_post_detail(post_id)
    if payload is None:
        return jsonify({"error": "Post not found."}), 404
    return jsonify(payload), 200


@posts_bp.route("/<int:post_id>", methods=["PUT"])
@jwt_required()
def update_post(post_id):
    """Update a blog post (author only)
    ---
    tags:
      - Posts
    security:
      - Bearer: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        schema:
          type: object
          properties:
            title:
              type: string
            content:
              type: string
            category_id:
              type: integer
    responses:
      200:
        description: Post updated
      403:
        description: Not the post author
      404:
        description: Post or category not found
    """
    user = get_current_user()
    post = db.session.get(Post, post_id)
    if post is None:
        return jsonify({"error": "Post not found."}), 404
    if post.user_id != user.id:
        return jsonify({"error": "You can only edit your own posts."}), 403

    try:
        data = post_update_schema.load(request.get_json() or {}, partial=True)
    except ValidationError as err:
        raise err

    if not data:
        return jsonify({"error": "No valid fields provided for update."}), 400

    if "title" in data:
        post.title = data["title"].strip()
    if "content" in data:
        post.content = data["content"].strip()
    if "category_id" in data:
        category = db.session.get(Category, data["category_id"])
        if category is None:
            return jsonify({"error": "Category not found."}), 404
        post.category_id = category.id

    db.session.commit()
    bust_caches_after_update(post_id)
    return jsonify(post_schema.dump(post)), 200


@posts_bp.route("/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    """Delete a blog post (author only)
    ---
    tags:
      - Posts
    security:
      - Bearer: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: Post deleted
      403:
        description: Not the post author
      404:
        description: Post not found
    """
    user = get_current_user()
    post = db.session.get(Post, post_id)
    if post is None:
        return jsonify({"error": "Post not found."}), 404
    if post.user_id != user.id:
        return jsonify({"error": "You can only delete your own posts."}), 403

    db.session.delete(post)
    db.session.commit()
    bust_caches_after_delete(post_id)
    return jsonify({"message": "Post deleted successfully."}), 200


@posts_bp.route("/<int:post_id>/comments", methods=["GET"])
def list_comments(post_id):
    """List all comments for a post
    ---
    tags:
      - Comments
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
    responses:
      200:
        description: List of comments
      404:
        description: Post not found
    """
    post = db.session.get(Post, post_id)
    if post is None:
        return jsonify({"error": "Post not found."}), 404

    comments = post.comments.order_by(Comment.created_at.asc()).all()
    return jsonify(comments_schema.dump(comments)), 200


@posts_bp.route("/<int:post_id>/comments", methods=["POST"])
@jwt_required()
def create_comment(post_id):
    """Create a comment on a post
    ---
    tags:
      - Comments
    security:
      - Bearer: []
    parameters:
      - in: path
        name: post_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - content
          properties:
            content:
              type: string
              example: Great article, thanks for sharing!
    responses:
      201:
        description: Comment created
      404:
        description: Post not found
    """
    user = get_current_user()
    post = db.session.get(Post, post_id)
    if post is None:
        return jsonify({"error": "Post not found."}), 404

    try:
        data = comment_create_schema.load(request.get_json() or {})
    except ValidationError as err:
        raise err

    comment = Comment(
        content=data["content"].strip(),
        user_id=user.id,
        post_id=post.id,
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment_schema.dump(comment)), 201


@search_bp.route("/search", methods=["GET"])
def search_posts():
    """Search posts by title or content
    ---
    tags:
      - Search
    parameters:
      - in: query
        name: q
        type: string
        required: true
        description: Search keyword
      - in: query
        name: page
        type: integer
        default: 1
    responses:
      200:
        description: Paginated search results
      400:
        description: Missing search query
    """
    keyword = (request.args.get("q") or "").strip()
    if not keyword:
        return jsonify({"error": "Query parameter 'q' is required."}), 400

    pattern = f"%{keyword}%"
    query = Post.query.filter(
        or_(Post.title.ilike(pattern), Post.content.ilike(pattern))
    ).order_by(Post.created_at.desc())

    payload = _paginate_query(query)
    return jsonify(paginated_posts_schema.dump(payload)), 200
