import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { saveStudent } from "../auth";
import { getFingerprint } from "../fingerprint";

// This page handles both "checking fingerprint" auto-login and manual login fallback
export default function StudentEntry() {
  const [checking, setChecking] = useState(false);
  const nav = useNavigate();

  // Manual login by name + admission number (for devices that cleared data)
  // We just redirect to register page — teacher must reset first
  return (
    <div className="container" style={{ paddingTop: "3rem" }}>
      <div className="card text-center">
        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📍</div>
        <h1>SmartAttend</h1>
        <p className="text-muted mb-2">Smart Attendance System</p>
        <p className="text-sm mb-2" style={{ color: "#4a5568" }}>
          If you have already registered on this device, you will be logged in automatically.
        </p>
        <Link to="/student/register" className="btn btn-primary btn-block">
          Register / First Time Login
        </Link>
        <p className="text-sm text-muted mt-2">
          Teacher? <Link to="/teacher/login">Teacher Login</Link>
        </p>
      </div>
      <div className="card">
        <h2>How it works</h2>
        <ol style={{ paddingLeft: "1.25rem", lineHeight: "2.2", fontSize: "0.9rem" }}>
          <li>Register once with your name and admission number.</li>
          <li>Your device is remembered — no password needed.</li>
          <li>When teacher starts a session, you'll see it on your dashboard.</li>
          <li>Enter the code and allow location to mark attendance.</li>
          <li>If you change devices, ask your teacher to reset your registration.</li>
        </ol>
      </div>
    </div>
  );
}
