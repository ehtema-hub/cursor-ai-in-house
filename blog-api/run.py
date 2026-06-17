import os

from dotenv import load_dotenv

from app import create_app
from app.extensions import db

load_dotenv()

app = create_app(os.getenv("FLASK_ENV", "development"))

with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5001)), debug=app.debug)
