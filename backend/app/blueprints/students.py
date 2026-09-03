import secrets
import hashlib
from flask import Blueprint, request, jsonify
from ..db import get_db

students_bp = Blueprint("students", __name__)

def _hash(token):
    return hashlib.sha256(token.encode()).hexdigest()

@students_bp.post("/register")
def register():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    admission_number = (data.get("admission_number") or "").strip()

    if not name or not admission_number:
        return jsonify({"error": "name and admission_number are required"}), 400

    db = get_db()

    res = db.table("students").select("*").eq("admission_number", admission_number).execute()
    if not res.data:
        return jsonify({"error": "Admission number not found in roster. Contact your teacher."}), 404

    student = res.data[0]

    if student.get("has_registered"):
        return jsonify({"error": "Already registered. Contact your teacher to reset if you changed devices."}), 409

    if student["name"].strip().lower() != name.lower():
        return jsonify({"error": "Name does not match our records. Enter your name exactly as given to the teacher."}), 400

    # Generate a unique token — stored in student's localStorage forever
    raw_token = secrets.token_urlsafe(32)
    token_hash = _hash(raw_token)

    db.table("students").update({
        "has_registered": True,
        "fingerprint_hash": token_hash,
    }).eq("id", student["id"]).execute()

    return jsonify({
        "message": "Registration successful",
        "token": raw_token,
        "student": {
            "id": student["id"],
            "name": student["name"],
            "admission_number": student["admission_number"],
        }
    }), 201
