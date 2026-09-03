import io
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, Response
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from ..db import get_db
from ..utils import haversine

attendance_bp = Blueprint("attendance", __name__)

def _get_active_session(db, code):
    res = db.table("sessions").select("*").eq("code", code.upper()).eq("is_active", True).execute()
    return res.data[0] if res.data else None

def _get_student_by_fingerprint(db, fingerprint_hash):
    res = db.table("students").select("*").eq("fingerprint_hash", fingerprint_hash).eq("has_registered", True).execute()
    return res.data[0] if res.data else None

@attendance_bp.post("/submit")
def submit():
    data = request.get_json(force=True)
    code = (data.get("code") or "").strip().upper()
    student_lat = data.get("student_lat")
    student_lng = data.get("student_lng")
    fingerprint_hash = data.get("fingerprint_hash") or ""

    if not code or student_lat is None or student_lng is None or not fingerprint_hash:
        return jsonify({"error": "code, student_lat, student_lng, fingerprint_hash required"}), 400

    db = get_db()

    # Validate session
    session = _get_active_session(db, code)
    if not session:
        return jsonify({"error": "Invalid or expired session code"}), 404

    # Validate student
    student = _get_student_by_fingerprint(db, fingerprint_hash)
    if not student:
        return jsonify({"error": "Device not recognized. Please register first."}), 401

    # Check duplicate
    dup = db.table("attendance").select("id").eq("session_id", session["id"])\
        .eq("student_id", student["id"]).execute()
    if dup.data:
        return jsonify({"error": "Attendance already submitted for this session"}), 409

    # Haversine distance
    distance = haversine(student_lat, student_lng, session["teacher_lat"], session["teacher_lng"])
    status = "present" if distance <= session["radius_m"] else "absent"
    now_iso = datetime.now(timezone.utc).isoformat()

    db.table("attendance").insert({
        "session_id": session["id"],
        "student_id": student["id"],
        "status": status,
        "student_lat": student_lat,
        "student_lng": student_lng,
        "distance_m": round(distance, 2),
        "submitted_at": now_iso,
    }).execute()

    if status == "absent":
        return jsonify({
            "error": "You are outside the classroom range",
            "status": "absent",
            "distance_m": round(distance, 2),
            "radius_m": session["radius_m"],
        }), 400

    return jsonify({"message": "Attendance marked present!", "status": "present", "distance_m": round(distance, 2)})


@attendance_bp.get("/session/<session_id>/pdf")
def export_pdf(session_id):
    db = get_db()

    session_res = db.table("sessions").select("*").eq("id", session_id).execute()
    if not session_res.data:
        return jsonify({"error": "Session not found"}), 404
    session = session_res.data[0]

    att_res = db.table("attendance").select(
        "status, submitted_at, distance_m, students(name, admission_number)"
    ).eq("session_id", session_id).order("status").execute()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    elements.append(Paragraph("Smart Attendance System", styles["Title"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Subject: {session.get('subject', 'General')}", styles["Normal"]))
    elements.append(Paragraph(f"Session Code: {session['code']}", styles["Normal"]))
    elements.append(Paragraph(f"Date: {session['created_at'][:10]}", styles["Normal"]))
    elements.append(Paragraph(f"Radius: {session['radius_m']}m", styles["Normal"]))
    elements.append(Spacer(1, 16))

    rows = att_res.data
    present = [r for r in rows if r["status"] == "present"]
    absent = [r for r in rows if r["status"] == "absent"]

    elements.append(Paragraph(f"Total: {len(rows)}  |  Present: {len(present)}  |  Absent: {len(absent)}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    # Table
    table_data = [["#", "Name", "Admission No.", "Status", "Distance", "Time"]]
    for i, r in enumerate(rows, 1):
        s = r.get("students") or {}
        time_str = r["submitted_at"][11:16] if r.get("submitted_at") else "-"
        dist_str = f"{r['distance_m']:.1f}m" if r.get("distance_m") else "-"
        table_data.append([
            str(i),
            s.get("name", "-"),
            s.get("admission_number", "-"),
            r["status"].upper(),
            dist_str,
            time_str,
        ])

    t = Table(table_data, colWidths=[25, 160, 100, 60, 60, 50])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d3748")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7fafc")]),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#cbd5e0")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("ALIGN", (1, 1), (2, -1), "LEFT"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))

    # Color present/absent rows
    for i, r in enumerate(rows, 1):
        color = colors.HexColor("#c6f6d5") if r["status"] == "present" else colors.HexColor("#fed7d7")
        t.setStyle(TableStyle([("BACKGROUND", (0, i), (-1, i), color)]))

    elements.append(t)
    doc.build(elements)
    buf.seek(0)

    return Response(
        buf.getvalue(),
        mimetype="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=attendance_{session_id[:8]}.pdf"}
    )
