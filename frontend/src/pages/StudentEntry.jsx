import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

function isInAppBrowser() {
  const ua = navigator.userAgent || "";
  return /FBAN|FBAV|Instagram|WhatsApp|Snapchat|MicroMessenger|Line\/|Twitter/i.test(ua);
}

export default function StudentEntry() {
  const [inApp, setInApp] = useState(false);
  const currentUrl = window.location.href;

  useEffect(() => {
    setInApp(isInAppBrowser());
  }, []);

  if (inApp) {
    return (
      <div className="container" style={{ paddingTop: "3rem" }}>
        <div className="card text-center">
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚠️</div>
          <h1>Open in Chrome</h1>
          <p className="text-muted mb-2" style={{ lineHeight: 1.7 }}>
            You opened this link inside WhatsApp or another app.<br />
            For attendance to work correctly, please open this in <strong>Chrome browser</strong>.
          </p>
          <div className="alert alert-warning">
            Your device fingerprint only works in Chrome. Opening here will not auto-login you.
          </div>
          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-block"
          >
            🌐 Open in Chrome
          </a>
          <p className="text-sm text-muted mt-2">
            Or copy this link and paste it in Chrome manually:<br />
            <strong style={{ wordBreak: "break-all", fontSize: "0.78rem" }}>{currentUrl}</strong>
          </p>
        </div>
      </div>
    );
  }

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
