import os

from dotenv import load_dotenv

from app import create_app

load_dotenv()

app = create_app(os.getenv("FLASK_ENV", "development"))

if __name__ == "__main__":
    use_reloader = app.debug and os.getenv("FLASK_DEBUG", "1") != "0"
    app.run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000)),
        debug=app.debug,
        use_reloader=use_reloader,
    )
