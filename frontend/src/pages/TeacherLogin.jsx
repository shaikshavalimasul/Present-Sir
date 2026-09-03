import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import { saveTeacher } from "../auth";

export default function TeacherLogin() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/teacher/login", form);
      saveTeacher(data);
      nav("/teacher/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="container" style={{ paddingTop: "3rem" }}>
      <div className="card">
        <h1 className="text-center">🎓 Teacher Login</h1>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>
        <p className="text-center text-sm text-muted mt-2">
          Student? <Link to="/student/login">Go to student page</Link>
        </p>
      </div>
    </div>
  );
}
