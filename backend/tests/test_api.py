import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timezone, timedelta
import hashlib
import io
import openpyxl


# ── 1. Session creation ──────────────────────────────────────────────────────

def test_create_session(client, monkeypatch):
    mock_db = MagicMock()
    session_row = {
        "id": "sess-uuid-1",
        "code": "ABC123",
        "subject": "Math",
        "teacher_lat": 17.385,
        "teacher_lng": 78.486,
        "radius_m": 40,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat(),
    }
    mock_table = MagicMock()
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[session_row])
    mock_db.table.return_value = mock_table

    monkeypatch.setattr("app.blueprints.sessions.get_db", lambda: mock_db)

    resp = client.post("/sessions/create", json={
        "teacher_id": "teacher-uuid-1",
        "teacher_lat": 17.385,
        "teacher_lng": 78.486,
        "radius_m": 40,
        "duration_minutes": 15,
        "subject": "Math",
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert "code" in data
    assert data["teacher_lat"] == 17.385


# ── 2. Debug-distance near teacher returns within_radius=True ────────────────

def test_debug_distance_near_teacher(client, monkeypatch):
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    session_row = {
        "id": "sess-uuid-2",
        "teacher_lat": 17.385044,
        "teacher_lng": 78.486671,
        "radius_m": 40,
        "expires_at": expires_at,
    }
    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.gt.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[session_row])
    mock_db.table.return_value = mock_table

    monkeypatch.setattr("app.blueprints.attendance.get_db", lambda: mock_db)

    resp = client.post("/attendance/debug-distance", json={
        "code": "ABC123",
        "student_lat": 17.385050,   # ~0.7m away
        "student_lng": 78.486675,
        "student_accuracy": 5,
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["within_radius"] is True


# ── 3. Submit attendance with valid coords returns present ───────────────────

def test_submit_attendance_present(client, monkeypatch):
    import hashlib, secrets
    raw_token = "test-token-abc"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    session_row = {
        "id": "sess-uuid-3",
        "teacher_lat": 17.385044,
        "teacher_lng": 78.486671,
        "radius_m": 100,
        "expires_at": expires_at,
    }
    student_row = {
        "id": "student-uuid-1",
        "admission_number": "ADM001",
        "device_token_hash": token_hash,
    }

    call_count = {"n": 0}

    def make_table(name):
        mock_table = MagicMock()
        mock_table.select.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.gt.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.limit.return_value = mock_table

        if name == "sessions":
            mock_table.execute.return_value = MagicMock(data=[session_row])
        elif name == "students":
            mock_table.execute.return_value = MagicMock(data=[student_row])
        elif name == "attendance":
            # first call = dup check (empty), second = insert
            results = [MagicMock(data=[]), MagicMock(data=[{"id": "att-1"}])]
            mock_table.execute.side_effect = results
        else:
            mock_table.execute.return_value = MagicMock(data=[])
        return mock_table

    mock_db = MagicMock()
    mock_db.table.side_effect = make_table
    monkeypatch.setattr("app.blueprints.attendance.get_db", lambda: mock_db)

    resp = client.post("/attendance/submit", json={
        "code": "ABC123",
        "student_lat": 17.385050,
        "student_lng": 78.486675,
        "student_accuracy": 5,
        "token": raw_token,
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "present"


# ── 4. Submit attendance with invalid coords returns 400 ────────────────────

def test_submit_attendance_outside_range(client, monkeypatch):
    import hashlib
    raw_token = "test-token-xyz"
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()

    session_row = {
        "id": "sess-uuid-4",
        "teacher_lat": 17.385044,
        "teacher_lng": 78.486671,
        "radius_m": 40,
        "expires_at": expires_at,
    }
    student_row = {
        "id": "student-uuid-2",
        "admission_number": "ADM002",
        "device_token_hash": token_hash,
    }

    def make_table(name):
        mock_table = MagicMock()
        mock_table.select.return_value = mock_table
        mock_table.insert.return_value = mock_table
        mock_table.eq.return_value = mock_table
        mock_table.gt.return_value = mock_table
        mock_table.order.return_value = mock_table
        mock_table.limit.return_value = mock_table

        if name == "sessions":
            mock_table.execute.return_value = MagicMock(data=[session_row])
        elif name == "students":
            mock_table.execute.return_value = MagicMock(data=[student_row])
        elif name == "attendance":
            results = [MagicMock(data=[]), MagicMock(data=[{"id": "att-2"}])]
            mock_table.execute.side_effect = results
        else:
            mock_table.execute.return_value = MagicMock(data=[])
        return mock_table

    mock_db = MagicMock()
    mock_db.table.side_effect = make_table
    monkeypatch.setattr("app.blueprints.attendance.get_db", lambda: mock_db)

    resp = client.post("/attendance/submit", json={
        "code": "ABC123",
        "student_lat": 17.400000,   # ~1.7km away
        "student_lng": 78.500000,
        "student_accuracy": 5,
        "token": raw_token,
    })
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["status"] == "absent"


# ── 5. Roster upload with valid Excel returns inserted counts ────────────────

def test_roster_upload(client, monkeypatch):
    # Build an in-memory xlsx
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["name", "admission_number", "email", "phone"])
    ws.append(["Alice", "ADM001", "alice@test.com", "9999999999"])
    ws.append(["Bob", "ADM002", "bob@test.com", "8888888888"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)

    mock_db = MagicMock()
    mock_table = MagicMock()
    mock_table.select.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.execute.return_value = MagicMock(data=[])  # no existing students
    mock_db.table.return_value = mock_table

    monkeypatch.setattr("app.blueprints.roster.get_db", lambda: mock_db)

    resp = client.post(
        "/roster/upload",
        data={"file": (buf, "roster.xlsx")},
        content_type="multipart/form-data",
    )
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["inserted"] == 2
    assert data["skipped"] == 0
