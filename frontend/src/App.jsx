import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { getTeacher, getStudent, saveStudent, getToken } from "./auth";
import api from "./api";

import TeacherLogin from "./pages/TeacherLogin";
import TeacherDashboard from "./pages/TeacherDashboard";
import RosterPage from "./pages/RosterPage";
import SessionHistory from "./pages/SessionHistory";
import StudentEntry from "./pages/StudentEntry";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";

function StudentAutoLogin({ children }) {
  const nav = useNavigate();
  const [done, setDone] = useState(false);

  useEffect(() => {
    // If already logged in this session, skip
    if (getStudent()) { setDone(true); return; }

    const token = getToken();
    console.log("Auto-login: token found =", !!token, token?.slice(0, 8));

    if (!token) { setDone(true); return; }

    api.post("/auth/student/verify-token", { token })
      .then(({ data }) => {
        console.log("Verify response:", data);
        if (data.matched) {
          saveStudent(data.student);
          nav("/student/dashboard", { replace: true });
        } else {
          setDone(true);
        }
      })
      .catch((err) => {
        console.log("Verify error:", err);
        setDone(true);
      });
  }, []);

  if (!done && !getStudent()) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", flexDirection: "column", gap: "1rem" }}>
        <div style={{ fontSize: "2.5rem" }}>📍</div>
        <p style={{ color: "#4a5568", fontSize: "1rem" }}>Logging you in…</p>
      </div>
    );
  }

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
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/teacher/dashboard" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        <Route path="/teacher/roster" element={<TeacherRoute><RosterPage /></TeacherRoute>} />
        <Route path="/teacher/history" element={<TeacherRoute><SessionHistory /></TeacherRoute>} />
        <Route path="/student/login" element={<StudentAutoLogin><StudentEntry /></StudentAutoLogin>} />
        <Route path="/student/register" element={<StudentAutoLogin><StudentRegister /></StudentAutoLogin>} />
        <Route path="/student/dashboard" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
