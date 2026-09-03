import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    app.secret_key = os.getenv("SESSION_SECRET_KEY", "dev-secret")

    allowed_origins = [
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    CORS(app, origins=allowed_origins, supports_credentials=True)

    from .blueprints.auth import auth_bp
    from .blueprints.roster import roster_bp
    from .blueprints.students import students_bp
    from .blueprints.sessions import sessions_bp
    from .blueprints.attendance import attendance_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(roster_bp, url_prefix="/roster")
    app.register_blueprint(students_bp, url_prefix="/students")
    app.register_blueprint(sessions_bp, url_prefix="/sessions")
    app.register_blueprint(attendance_bp, url_prefix="/attendance")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app
