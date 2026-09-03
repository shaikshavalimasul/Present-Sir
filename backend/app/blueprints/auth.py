import hashlib
import bcrypt
from flask import Blueprint, request, jsonify
from ..db import get_db

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/teacher/login")
def teacher_login():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not username or not password:
        return jsonify({"error": "username and password required"}), 400
    db = get_db()
    res = db.table("teachers").select("*").eq("username", username).execute()
    if not res.data:
        return jsonify({"error": "Invalid credentials"}), 401
    teacher = res.data[0]
    if not bcrypt.checkpw(password.encode(), teacher["password_hash"].encode()):
        return jsonify({"error": "Invalid credentials"}), 401
    return jsonify({"id": teacher["id"], "name": teacher["name"], "username": teacher["username"], "role": "teacher"})

@auth_bp.post("/teacher/create")
def create_teacher():
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    if not name or not username or not password:
        return jsonify({"error": "name, username, password required"}), 400
    db = get_db()
    if db.table("teachers").select("id").eq("username", username).execute().data:
        return jsonify({"error": "Username already exists"}), 409
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    res = db.table("teachers").insert({"name": name, "username": username, "password_hash": pw_hash}).execute()
    return jsonify({"message": "Teacher created", "id": res.data[0]["id"]}), 201

@auth_bp.post("/student/verify-token")
def verify_token():
    data = request.get_json(force=True)
    token = data.get("token") or ""
    if not token:
        return jsonify({"matched": False}), 200
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    db = get_db()
    res = db.table("students").select("*").eq("fingerprint_hash", token_hash).eq("has_registered", True).execute()
    if not res.data:
        return jsonify({"matched": False}), 200
    student = res.data[0]
    return jsonify({"matched": True, "student": {"id": student["id"], "name": student["name"], "admission_number": student["admission_number"]}})
