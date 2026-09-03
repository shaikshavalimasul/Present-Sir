import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getTeacher } from "../auth";
import TeacherNav from "../components/TeacherNav";
import useGeoLocation from "../components/useGeoLocation";

export default function TeacherDashboard() {
  const teacher = getTeacher();
  const nav = useNavigate();
  const { location, error: geoError, loading: geoLoading, fetch: fetchGeo } = useGeoLocation();
  const [activeSession, setActiveSession] = useState(null);
  const [liveRows, setLiveRows] = useState([]);
  const [form, setForm] = useState({ subject: "", radius_m: 40 });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [stopping, setStopping] = useState(false);

  // Load active session on mount
  useEffect(() => { loadActive(); }, []);

  // Auto-refresh live attendance every 8s when session is active
  useEffect(() => {
    if (!activeSession) return;
    loadLive(activeSession.id);
    const t = setInterval(() => loadLive(activeSession.id), 8000);
    return () => clearInterval(t);
  }, [activeSession]);

  const loadActive = async () => {
    try {
      const { data } = await api.get("/sessions/active");
      if (data.active) setActiveSession(data.session);
      else setActiveSession(null);
    } catch {}
  };

  const loadLive = async (sessionId) => {
    try {
      const { data } = await api.get(`/sessions/${sessionId}/attendance`);
      setLiveRows(data);
    } catch {}
  };

  const startSession = async (e) => {
    e.preventDefault();
    if (!location) { setError("Please capture your location first."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/sessions/start", {
        teacher_id: teacher.id,
        teacher_lat: location.lat,
        teacher_lng: location.lng,
        radius_m: Number(form.radius_m),
        subject: form.subject || "General",
      });
      setActiveSession(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start session");
    } finally { setLoading(false); }
  };

  const stopSession = async () => {
    if (!confirm("Stop the session? Absent rows will be auto-inserted.")) return;
    setStopping(true);
    try {
      await api.post(`/sessions/${activeSession.id}/stop`);
      setActiveSession(null);
      setLiveRows([]);
      nav("/teacher/history");
    } catch (err) {
      alert(err.response?.data?.error || "Failed to stop session");
    } finally { setStopping(false); }
  };

  const present = liveRows.filter(r => r.status === "present").length;
  const absent = liveRows.filter(r => r.status === "absent").length;

  return (
    <>
      <TeacherNav />
      <div className="container-wide" style={{ paddingTop: "1.5rem" }}>
        <h1>Welcome, {teacher?.name} 👋</h1>

        {activeSession ? (
          <>
            <div className="session-banner">
              <h2>🟢 Session Active — {activeSession.subject}</h2>
              <p className="text-sm" style={{ opacity: 0.9 }}>
                Share this code with students · Radius: {activeSession.radius_m}m
              </p>
              <div className="code-box">{activeSession.code}</div>
              <button className="btn btn-danger" onClick={stopSession} disabled={stopping}>
                {stopping ? "Stopping…" : "⏹ Stop Session"}
              </button>
            </div>

            <div className="stat-row">
              <div className="stat-card">
                <div className="stat-num" style={{ color: "#276749" }}>{present}</div>
                <div className="stat-label">Present</div>
              </div>
              <div className="stat-card">
                <div className="stat-num" style={{ color: "#9b2c2c" }}>{absent}</div>
                <div className="stat-label">Absent</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{liveRows.length}</div>
                <div className="stat-label">Submitted</div>
              </div>
            </div>

            <div className="card overflow-x">
              <h2>Live Attendance</h2>
              <table>
                <thead>
                  <tr><th>Name</th><th>Admission No.</th><th>Status</th><th>Distance</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {liveRows.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-muted" style={{ padding: "1rem" }}>Waiting for students…</td></tr>
                  ) : liveRows.map(r => (
                    <tr key={r.id}>
                      <td>{r.students?.name || "—"}</td>
                      <td>{r.students?.admission_number || "—"}</td>
                      <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                      <td>{r.distance_m != null ? `${r.distance_m.toFixed(1)}m` : "—"}</td>
                      <td>{r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-sm text-muted mt-1">Auto-refreshes every 8 seconds.</p>
            </div>
          </>
        ) : (
          <div className="card">
            <h2>Start New Session</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {geoError && <div className="alert alert-error">{geoError}</div>}

            <div className="mb-2">
              <button className="btn btn-secondary" onClick={fetchGeo} disabled={geoLoading}>
                {geoLoading ? "📡 Fetching…" : "📍 Capture My Location"}
              </button>
              {location && (
                <div className="loc-box mt-1">
                  ✅ Lat: {location.lat.toFixed(6)} · Lng: {location.lng.toFixed(6)} · Accuracy: ±{location.accuracy.toFixed(0)}m
                </div>
              )}
            </div>

            <form onSubmit={startSession}>
              <div className="form-group">
                <label>Subject (optional)</label>
                <input placeholder="e.g. Mathematics" value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Geofence Radius (meters)</label>
                <input type="number" min="10" max="500" value={form.radius_m}
                  onChange={e => setForm({ ...form, radius_m: e.target.value })} required />
              </div>
              <button className="btn btn-success btn-block" disabled={loading || !location}>
                {loading ? "Starting…" : "▶ Start Session"}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
