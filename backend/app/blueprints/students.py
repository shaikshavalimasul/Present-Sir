from flask import Blueprint, request, jsonify
from ..db import get_db

students_bp = Blueprint("students", __name__)

@students_bp.post("/register")
def register():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    admission_number = (data.get("admission_number") or "").strip()
    fingerprint_hash = data.get("fingerprint_hash") or ""

    if not name or not admission_number or not fingerprint_hash:
        return jsonify({"error": "name, admission_number and fingerprint_hash required"}), 400

    db = get_db()

    # Check student exists in roster
    res = db.table("students").select("*").eq("admission_number", admission_number).execute()
    if not res.data:
        return jsonify({"error": "Admission number not found in roster. Contact your teacher."}), 404

    student = res.data[0]

    # Check already registered
    if student.get("has_registered"):
        return jsonify({"error": "Already registered. You cannot register again. Contact your teacher if you need help."}), 409

    # Verify name matches roster (case-insensitive)
    if student["name"].strip().lower() != name.lower():
        return jsonify({"error": "Name does not match our records. Please enter your name exactly as given to the teacher."}), 400

    # Check fingerprint not already used by another student
    fp_check = db.table("students").select("id").eq("fingerprint_hash", fingerprint_hash).execute()
    if fp_check.data:
        return jsonify({"error": "This device is already registered to another student."}), 409

    # Register student
    db.table("students").update({
        "has_registered": True,
        "fingerprint_hash": fingerprint_hash,
    }).eq("id", student["id"]).execute()

    return jsonify({
        "message": "Registration successful",
        "student": {"id": student["id"], "name": student["name"], "admission_number": student["admission_number"]}
    }), 201
