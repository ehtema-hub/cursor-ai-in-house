from marshmallow import Schema, fields, validate

from app.extensions import ma
from app.models import Category, Comment, Post, User


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        exclude = ("password_hash",)


class CategorySchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Category
        load_instance = True
        include_fk = True


class CommentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Comment
        load_instance = True
        include_fk = True

    author = ma.Nested(UserSchema, dump_only=True)


class PostSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Post
        load_instance = True
        include_fk = True

    author = ma.Nested(UserSchema, dump_only=True)
    category = ma.Nested(CategorySchema, dump_only=True)
    comments = ma.Nested(CommentSchema, many=True, dump_only=True)


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    username = fields.String(required=True, validate=validate.Length(min=3, max=80))
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))


class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)


class PostCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=3, max=255))
    content = fields.String(required=True, validate=validate.Length(min=10))
    category_id = fields.Integer(required=True)


class PostUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=3, max=255))
    content = fields.String(validate=validate.Length(min=10))
    category_id = fields.Integer()


class CommentCreateSchema(Schema):
    content = fields.String(required=True, validate=validate.Length(min=1, max=5000))


class TokenSchema(Schema):
    access_token = fields.String(required=True)
    token_type = fields.String(load_default="Bearer")


class PaginationMetaSchema(Schema):
    total = fields.Integer()
    pages = fields.Integer()
    page = fields.Integer()
    per_page = fields.Integer()
    next_page = fields.Integer(allow_none=True)
    prev_page = fields.Integer(allow_none=True)


class PaginatedPostsSchema(Schema):
    items = fields.Nested(PostSchema, many=True)
    meta = fields.Nested(PaginationMetaSchema)
