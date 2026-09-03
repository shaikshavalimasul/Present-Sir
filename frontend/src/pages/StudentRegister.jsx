import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { saveStudent, saveToken, getToken } from "../auth";

export default function StudentRegister() {
  const [form, setForm] = useState({ name: "", admission_number: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/students/register", {
        name: form.name.trim(),
        admission_number: form.admission_number.trim(),
      });
      saveToken(data.token);
      saveStudent(data.student);
      console.log("Registered. Token saved:", data.token.slice(0, 8));
      nav("/student/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="container" style={{ paddingTop: "3rem" }}>
      <div className="card">
        <h1 className="text-center">📝 Student Registration</h1>
        <div className="alert alert-info">
          Your admission number must be in the teacher's roster. Your name must match exactly.
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Full Name (exactly as given to teacher)</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Admission Number / Roll Number</label>
            <input value={form.admission_number} onChange={e => setForm({ ...form, admission_number: e.target.value })} required />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Registering…" : "Register This Device"}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-2">
          <Link to="/student/login">← Back</Link>
        </p>
      </div>
    </div>
  );
}
