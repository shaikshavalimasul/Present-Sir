import { Link, useNavigate } from "react-router-dom";
import { clearTeacher } from "../auth";

export default function TeacherNav() {
  const nav = useNavigate();
  return (
    <nav className="nav">
      <Link className="nav-brand" to="/teacher/dashboard">🎓 SmartAttend</Link>
      <div className="nav-links">
        <Link to="/teacher/dashboard">Dashboard</Link>
        <Link to="/teacher/roster">Roster</Link>
        <Link to="/teacher/history">History</Link>
        <button onClick={() => { clearTeacher(); nav("/teacher/login"); }}>Logout</button>
      </div>
    </nav>
  );
}
