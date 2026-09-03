import random
import string
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..db import get_db

sessions_bp = Blueprint("sessions", __name__)

def _unique_code(db):
    for _ in range(10):
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
        if not db.table("sessions").select("id").eq("code", code).eq("is_active", True).execute().data:
            return code
    raise RuntimeError("Could not generate unique code")

@sessions_bp.post("/start")
def start_session():
    data = request.get_json(force=True)
    teacher_id = data.get("teacher_id")
    teacher_lat = data.get("teacher_lat")
    teacher_lng = data.get("teacher_lng")
    teacher_accuracy = float(data.get("teacher_accuracy") or 0)
    radius_m = int(data.get("radius_m", 40))
    subject = (data.get("subject") or "General").strip()

    if not teacher_id or teacher_lat is None or teacher_lng is None:
        return jsonify({"error": "teacher_id, teacher_lat, teacher_lng required"}), 400

    db = get_db()

    # Close any existing active session for this teacher
    db.table("sessions").update({"is_active": False, "closed_at": datetime.now(timezone.utc).isoformat()})\
        .eq("teacher_id", teacher_id).eq("is_active", True).execute()

    code = _unique_code(db)
    res = db.table("sessions").insert({
        "teacher_id": teacher_id,
        "subject": subject,
        "code": code,
        "teacher_lat": teacher_lat,
        "teacher_lng": teacher_lng,
        "teacher_accuracy": teacher_accuracy,
        "radius_m": radius_m,
        "is_active": True,
    }).execute()

    session = res.data[0]
    return jsonify({
        "id": session["id"],
        "code": session["code"],
        "subject": session["subject"],
        "radius_m": session["radius_m"],
        "created_at": session["created_at"],
    }), 201

@sessions_bp.post("/<session_id>/stop")
def stop_session(session_id):
    db = get_db()
    res = db.table("sessions").select("*").eq("id", session_id).execute()
    if not res.data:
        return jsonify({"error": "Session not found"}), 404

    now_iso = datetime.now(timezone.utc).isoformat()
    db.table("sessions").update({"is_active": False, "closed_at": now_iso}).eq("id", session_id).execute()

    # Auto-insert absent for students who did not submit
    all_students = db.table("students").select("id").eq("has_registered", True).execute().data
    submitted = {r["student_id"] for r in db.table("attendance").select("student_id").eq("session_id", session_id).execute().data}
    absent_rows = [{"session_id": session_id, "student_id": s["id"], "status": "absent", "submitted_at": now_iso}
                   for s in all_students if s["id"] not in submitted]
    if absent_rows:
        db.table("attendance").insert(absent_rows).execute()

    return jsonify({"message": "Session stopped", "auto_absent": len(absent_rows)})

@sessions_bp.get("/active")
def get_active_session():
    db = get_db()
    res = db.table("sessions").select("id, code, subject, radius_m, created_at")\
        .eq("is_active", True).order("created_at", desc=True).limit(1).execute()
    if not res.data:
        return jsonify({"active": False})
    return jsonify({"active": True, "session": res.data[0]})

@sessions_bp.get("/history")
def session_history():
    teacher_id = request.args.get("teacher_id")
    if not teacher_id:
        return jsonify({"error": "teacher_id required"}), 400
    db = get_db()
    res = db.table("sessions").select("*").eq("teacher_id", teacher_id)\
        .order("created_at", desc=True).execute()
    return jsonify(res.data)

@sessions_bp.get("/<session_id>/attendance")
def session_attendance(session_id):
    db = get_db()
    res = db.table("attendance").select(
        "id, status, submitted_at, distance_m, students(name, admission_number)"
    ).eq("session_id", session_id).execute()
    return jsonify(res.data)
