import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getTeacher, getStudent, saveStudent } from "./auth";
import { getFingerprint } from "./fingerprint";
import api from "./api";

import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import RosterPage from "./pages/RosterPage";
import SessionHistory from "./pages/SessionHistory";
import StudentEntry from "./pages/StudentEntry";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";

// Auto-login student by fingerprint
function StudentAutoLogin({ children }) {
  const nav = useNavigate();
  const student = getStudent();

  useEffect(() => {
    if (student) return;
    (async () => {
      const fp = await getFingerprint();
      try {
        const { data } = await api.post("/auth/student/verify-fingerprint", { fingerprint_hash: fp });
        if (data.matched) {
          saveStudent(data.student);
          nav("/student/dashboard", { replace: true });
        }
      } catch {}
    })();
  }, []);

  return children;
}

function TeacherRoute({ children }) {
  return getTeacher() ? children : <Navigate to="/teacher/login" replace />;
}
function StudentRoute({ children }) {
  return getStudent() ? children : <Navigate to="/student/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/student/login" replace />} />

        {/* Teacher */}
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        <Route path="/teacher/roster" element={<TeacherRoute><RosterPage /></TeacherRoute>} />
        <Route path="/teacher/history" element={<TeacherRoute><SessionHistory /></TeacherRoute>} />

        {/* Student */}
        <Route path="/student/login" element={<StudentAutoLogin><StudentEntry /></StudentAutoLogin>} />
        <Route path="/student/register" element={<StudentAutoLogin><StudentRegister /></StudentAutoLogin>} />
        <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
