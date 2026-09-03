-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if rebuilding
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;

-- Teachers table (single teacher for now)
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  admission_number TEXT UNIQUE NOT NULL,
  has_registered BOOLEAN DEFAULT FALSE,
  fingerprint_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID REFERENCES teachers(id),
  subject TEXT DEFAULT 'General',
  code TEXT NOT NULL,
  teacher_lat DOUBLE PRECISION NOT NULL,
  teacher_lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER DEFAULT 40,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id),
  student_id UUID REFERENCES students(id),
  status TEXT CHECK (status IN ('present', 'absent')) DEFAULT 'absent',
  student_lat DOUBLE PRECISION,
  student_lng DOUBLE PRECISION,
  distance_m DOUBLE PRECISION,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(code);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(admission_number);
