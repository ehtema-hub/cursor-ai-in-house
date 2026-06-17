from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from marshmallow import ValidationError

from app.extensions import db
from app.models import User
from app.schemas import LoginSchema, RegisterSchema, TokenSchema, UserSchema

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

register_schema = RegisterSchema()
login_schema = LoginSchema()
user_schema = UserSchema()
token_schema = TokenSchema()


@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user account
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - username
            - password
          properties:
            email:
              type: string
              format: email
              example: author@blog.local
            username:
              type: string
              example: jane_writer
            password:
              type: string
              format: password
              example: SecurePass123!
    responses:
      201:
        description: User created successfully
      400:
        description: Validation error
      409:
        description: Email or username already exists
    """
    try:
        data = register_schema.load(request.get_json() or {})
    except ValidationError as err:
        raise err

    email = data["email"].lower().strip()
    username = data["username"].strip()

    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({"error": "Email or username already exists."}), 409

    user = User(email=email, username=username)
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    return jsonify(user_schema.dump(user)), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate and receive a JWT access token
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              format: email
              example: author@blog.local
            password:
              type: string
              format: password
              example: SecurePass123!
    responses:
      200:
        description: JWT access token
      401:
        description: Invalid credentials
    """
    try:
        data = login_schema.load(request.get_json() or {})
    except ValidationError as err:
        raise err

    user = User.query.filter_by(email=data["email"].lower()).first()
    if user is None or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid email or password."}), 401

    access_token = create_access_token(identity=str(user.id))
    return jsonify(token_schema.dump({"access_token": access_token})), 200
