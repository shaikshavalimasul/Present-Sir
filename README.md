# Present-Sir — Attendance Tracking Prototype

A full-stack web prototype for teacher/student geolocation-based attendance.

## Architecture

```
Present-Sir/
├── backend/          # Flask API
│   ├── app/
│   │   ├── __init__.py       # App factory + CORS
│   │   ├── db.py             # Supabase client
│   │   ├── utils.py          # Haversine formula
│   │   └── blueprints/
│   │       ├── auth.py       # Teacher/student login
│   │       ├── sessions.py   # Session CRUD
│   │       ├── roster.py     # Excel upload
│   │       ├── registration.py  # Student registration
│   │       └── attendance.py    # Submit + debug + CSV export
│   ├── tests/
│   │   ├── conftest.py
│   │   └── test_api.py
│   ├── run.py
│   └── requirements.txt
├── frontend/         # React + Vite
│   └── src/
│       ├── pages/    # All page components
│       ├── components/  # Shared nav + geolocation hook
│       ├── api.js    # Axios instance
│       └── auth.js   # localStorage helpers
├── migrations/
│   └── 001_initial_schema.sql
└── .env.example
```

## Environment Variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon or service-role key |
| `PORT` | Backend port (default: 5000) |
| `DEBUG` | Flask debug mode (true/false) |
| `FRONTEND_URL` | Frontend origin for CORS |
| `SESSION_SECRET_KEY` | Flask session secret |

## Setup Instructions

### 1. Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `migrations/001_initial_schema.sql`
3. Copy your **Project URL** and **anon/service-role key** from Project Settings → API

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in your credentials
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux

python run.py
```

Backend runs at `http://localhost:5000`

### 3. Frontend

```bash
cd frontend
npm install

# Copy and set VITE_API_URL
copy .env.example .env.local   # Windows
# cp .env.example .env.local   # macOS/Linux
# Edit .env.local: VITE_API_URL=http://localhost:5000

npm run dev
```

Frontend runs at `http://localhost:5173`

### 4. Create a Teacher Account

```bash
curl -X POST http://localhost:5000/auth/teacher/create \
  -H "Content-Type: application/json" \
  -d '{"name":"Dr. Smith","username":"teacher1","password":"pass123"}'
```

## Local Run Instructions

1. Start backend: `cd backend && python run.py`
2. Start frontend: `cd frontend && npm run dev`
3. Open `http://localhost:5173`
4. Teacher flow: Login → Upload Roster → Create Session → Share Code
5. Student flow: Register → Login → Enter Code → Submit Attendance

## Test Instructions

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Tests cover:
1. Session creation
2. Debug-distance near teacher returns `within_radius: true`
3. Submit attendance with valid coords → present
4. Submit attendance with far coords → 400 absent
5. Roster upload with valid Excel → inserted counts

## API Examples

### Create Session
```
POST /sessions/create
{"teacher_id":"uuid","teacher_lat":17.385,"teacher_lng":78.486,"radius_m":40,"duration_minutes":15,"subject":"Math"}
```

### Submit Attendance
```
POST /attendance/submit
{"code":"ABC123","student_lat":17.385,"student_lng":78.486,"student_accuracy":10,"token":"raw-token"}
```

### Debug Distance
```
POST /attendance/debug-distance
{"code":"ABC123","student_lat":17.385,"student_lng":78.486,"student_accuracy":10}
```

### Export CSV
```
GET /attendance/session/{session_id}/export
```

### Upload Roster
```
POST /roster/upload   (multipart/form-data, field: file)
```

### Close Session
```
POST /sessions/{session_id}/close
```
