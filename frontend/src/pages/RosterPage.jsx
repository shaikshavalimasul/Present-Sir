import { useState, useEffect, useRef } from "react";
import api from "../api";
import TeacherNav from "../components/TeacherNav";
import { getTeacher } from "../auth";

export default function RosterPage() {
  const teacher = getTeacher();
  const [students, setStudents] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    try {
      const { data } = await api.get("/roster/students");
      setStudents(data);
    } catch {}
  };

  const upload = async (e) => {
    e.preventDefault();
    const file = fileRef.current.files[0];
    if (!file) { setError("Please select a file."); return; }
    setError(""); setLoading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const { data } = await api.post("/roster/upload", fd);
      setUploadResult(data);
      loadStudents();
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed");
    } finally { setLoading(false); }
  };

  const resetStudent = async (id, name) => {
    if (!confirm(`Reset registration for ${name}? They will need to re-register.`)) return;
    setResetting(id);
    try {
      await api.post(`/roster/students/${id}/reset`);
      loadStudents();
    } catch (err) {
      alert(err.response?.data?.error || "Reset failed");
    } finally { setResetting(null); }
  };

  return (
    <>
      <TeacherNav />
      <div className="container-wide" style={{ paddingTop: "1.5rem" }}>
        <h1>Student Roster</h1>

        <div className="card">
          <h2>Upload Excel Roster</h2>
          <div className="alert alert-info">
            Excel must have columns: <strong>name</strong> and <strong>admission_number</strong>
          </div>
          {error && <div className="alert alert-error">{error}</div>}
          {uploadResult && (
            <div className="alert alert-success">
              ✅ Inserted: <strong>{uploadResult.inserted}</strong> · Skipped (already exist): <strong>{uploadResult.skipped}</strong>
            </div>
          )}
          <form onSubmit={upload} className="flex gap-1 items-center flex-wrap">
            <input type="file" accept=".xlsx,.xls" ref={fileRef} style={{ flex: 1 }} />
            <button className="btn btn-primary" disabled={loading}>
              {loading ? "Uploading…" : "Upload"}
            </button>
          </form>
        </div>

        <div className="card overflow-x">
          <h2>All Students ({students.length})</h2>
          <table>
            <thead>
              <tr><th>#</th><th>Name</th><th>Admission No.</th><th>Registered</th><th>Action</th></tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: "1rem" }}>No students yet. Upload a roster.</td></tr>
              ) : students.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{s.name}</td>
                  <td>{s.admission_number}</td>
                  <td>
                    <span className={`badge ${s.has_registered ? "badge-present" : "badge-absent"}`}>
                      {s.has_registered ? "Yes" : "No"}
                    </span>
                  </td>
                  <td>
                    {s.has_registered && (
                      <button
                        className="btn btn-warning"
                        style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
                        disabled={resetting === s.id}
                        onClick={() => resetStudent(s.id, s.name)}
                      >
                        {resetting === s.id ? "Resetting…" : "Reset"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
