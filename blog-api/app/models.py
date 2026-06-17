from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from app.extensions import db


def _utcnow():
    return datetime.now(timezone.utc)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=_utcnow, nullable=False, index=True)

    posts = db.relationship("Post", back_populates="author", cascade="all, delete-orphan", lazy="dynamic")
    comments = db.relationship("Comment", back_populates="author", cascade="all, delete-orphan", lazy="dynamic")

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Category(db.Model):
    __tablename__ = "categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=_utcnow, nullable=False)

    posts = db.relationship("Post", back_populates="category", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<Category {self.name}>"


class Post(db.Model):
    __tablename__ = "posts"
    __table_args__ = (
        db.Index("ix_posts_category_created", "category_id", "created_at"),
        db.Index("ix_posts_user_created", "user_id", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=_utcnow, nullable=False, index=True)
    updated_at = db.Column(db.DateTime, default=_utcnow, onupdate=_utcnow, nullable=False)

    author = db.relationship("User", back_populates="posts")
    category = db.relationship("Category", back_populates="posts")
    comments = db.relationship(
        "Comment",
        back_populates="post",
        cascade="all, delete-orphan",
        lazy="dynamic",
        order_by="Comment.created_at.asc()",
    )

    def __repr__(self) -> str:
        return f"<Post {self.title}>"


class Comment(db.Model):
    __tablename__ = "comments"
    __table_args__ = (
        db.Index("ix_comments_post_created", "post_id", "created_at"),
    )

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=_utcnow, nullable=False, index=True)

    author = db.relationship("User", back_populates="comments")
    post = db.relationship("Post", back_populates="comments")

    def __repr__(self) -> str:
        return f"<Comment {self.id} on Post {self.post_id}>"
