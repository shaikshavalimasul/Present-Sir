import { useState, useEffect } from "react";
import { getStudent } from "../auth";
import api from "../api";
import StudentNav from "../components/StudentNav";
import useGeoLocation from "../components/useGeoLocation";
import { getFingerprint } from "../fingerprint";

export default function StudentDashboard() {
  const student = getStudent();
  const { location, error: geoError, loading: geoLoading, fetch: fetchGeo } = useGeoLocation();
  const [activeSession, setActiveSession] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    checkSession();
    const t = setInterval(checkSession, 10000);
    return () => clearInterval(t);
  }, []);

  const checkSession = async () => {
    try {
      const { data } = await api.get("/sessions/active");
      setActiveSession(data.active ? data.session : null);
    } catch {}
  };

  const submit = async () => {
    if (!location) { setError("Please capture your location first."); return; }
    if (!code.trim()) { setError("Please enter the session code."); return; }
    setError(""); setLoading(true);
    try {
      const fingerprint_hash = await getFingerprint();
      const { data } = await api.post("/attendance/submit", {
        code: code.toUpperCase(),
        student_lat: location.lat,
        student_lng: location.lng,
        fingerprint_hash,
      });
      setResult({ success: true, ...data });
    } catch (err) {
      const d = err.response?.data || {};
      setResult({ success: false, ...d });
    } finally { setLoading(false); setConfirmed(false); }
  };

  return (
    <>
      <StudentNav />
      <div className="container" style={{ paddingTop: "1.5rem" }}>
        <div className="card">
          <h1>Hello, {student?.name} 👋</h1>
          <p className="text-muted text-sm">Admission: {student?.admission_number}</p>
        </div>

        {activeSession ? (
          <div className="session-banner">
            <h2>🟢 Class is in session!</h2>
            <p className="text-sm" style={{ opacity: 0.9 }}>Subject: {activeSession.subject}</p>
          </div>
        ) : (
          <div className="alert alert-info">
            ⏳ No active session right now. Auto-refreshes every 10 seconds.
          </div>
        )}

        {result && (
          <div className={`alert ${result.success ? "alert-success" : "alert-error"}`}>
            {result.success ? (
              <>✅ <strong>Attendance marked PRESENT!</strong> Distance: {result.distance_m}m</>
            ) : (
              <>
                ❌ {result.error}
                {result.distance_m != null && (
                  <div className="mt-1">
                    You are <strong>{result.distance_m}m</strong> away. Allowed radius: <strong>{result.radius_m}m</strong>
                  </div>
                )}
              </>
            )}
            <div className="mt-1">
              <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.3rem 0.7rem" }}
                onClick={() => { setResult(null); setCode(""); setConfirmed(false); }}>
                Dismiss
              </button>
            </div>
          </div>
        )}

        {!result && (
          <div className="card">
            <h2>Mark Attendance</h2>
            {error && <div className="alert alert-error">{error}</div>}
            {geoError && <div className="alert alert-error">{geoError}</div>}

            <div className="form-group">
              <label>Session Code (from teacher)</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC123"
                style={{ textTransform: "uppercase", letterSpacing: "0.25rem", fontSize: "1.4rem", textAlign: "center" }}
              />
            </div>

            <div className="mb-2">
              <button className="btn btn-secondary" onClick={fetchGeo} disabled={geoLoading}>
                {geoLoading ? "📡 Fetching…" : "📍 Get My Location"}
              </button>
              {location && (
                <div className="loc-box mt-1">
                  ✅ Location captured · Accuracy: ±{location.accuracy.toFixed(0)}m
                  {location.accuracy > 50 && (
                    <div className="mt-1" style={{ color: "#c05621" }}>
                      ⚠️ Poor accuracy. Move outdoors and re-fetch.
                    </div>
                  )}
                </div>
              )}
            </div>

            {!confirmed ? (
              <button className="btn btn-primary btn-block" disabled={!location || code.length < 6}
                onClick={() => setConfirmed(true)}>
                Submit Attendance
              </button>
            ) : (
              <>
                <div className="alert alert-warning">
                  Confirm attendance for code <strong>{code}</strong>?
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-success" style={{ flex: 1 }} onClick={submit} disabled={loading}>
                    {loading ? "Submitting…" : "✅ Confirm"}
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmed(false)}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
