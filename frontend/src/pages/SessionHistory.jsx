import { useState, useEffect } from "react";
import api from "../api";
import { getTeacher } from "../auth";
import TeacherNav from "../components/TeacherNav";

export default function SessionHistory() {
  const teacher = getTeacher();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    api.get(`/sessions/history?teacher_id=${teacher.id}`)
      .then(r => setSessions(r.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <TeacherNav />
      <div className="container-wide" style={{ paddingTop: "1.5rem" }}>
        <h1>Session History</h1>
        {loading ? <p>Loading…</p> : (
          <div className="card overflow-x">
            <table>
              <thead>
                <tr><th>#</th><th>Subject</th><th>Code</th><th>Radius</th><th>Date</th><th>Status</th><th>PDF</th></tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted" style={{ padding: "1rem" }}>No sessions yet.</td></tr>
                ) : sessions.map((s, i) => (
                  <tr key={s.id}>
                    <td>{i + 1}</td>
                    <td>{s.subject}</td>
                    <td><strong>{s.code}</strong></td>
                    <td>{s.radius_m}m</td>
                    <td>{new Date(s.created_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${s.is_active ? "badge-active" : "badge-closed"}`}>
                        {s.is_active ? "Active" : "Closed"}
                      </span>
                    </td>
                    <td>
                      <a
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
                        href={`${API_URL}/attendance/session/${s.id}/pdf`}
                        target="_blank" rel="noreferrer"
                      >
                        📄 PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
