import hashlib
import logging
import secrets
import bcrypt
from flask import Blueprint, request, jsonify
from ..db import get_db

registration_bp = Blueprint("registration", __name__)
logger = logging.getLogger(__name__)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@registration_bp.post("/register")
def register_student():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    admission_number = (data.get("admission_number") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()

    if not name or not admission_number:
        return jsonify({"error": "name and admission_number are required"}), 400

    db = get_db()
    res = db.table("students").select("*").eq("admission_number", admission_number).execute()

    if not res.data:
        return jsonify({"error": "Admission number not found in roster. Contact your teacher."}), 404

    student = res.data[0]
    if student.get("has_registered"):
        return jsonify({"error": "Already registered. Please login."}), 409

    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash_token(raw_token)

    db.table("students").update({
        "name": name,
        "email": email,
        "phone": phone,
        "device_token_hash": token_hash,
        "has_registered": True,
    }).eq("admission_number", admission_number).execute()

    logger.info("Student registered: %s token_prefix=%s", admission_number, raw_token[:8])
    return jsonify({
        "message": "Registration successful",
        "token": raw_token,
        "admission_number": admission_number,
        "name": name,
    }), 201
