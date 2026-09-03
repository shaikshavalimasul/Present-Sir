import { Link, useNavigate } from "react-router-dom";
import { clearStudent } from "../auth";

export default function StudentNav() {
  const nav = useNavigate();
  return (
    <nav className="nav">
      <Link className="nav-brand" to="/student/dashboard">📍 SmartAttend</Link>
      <div className="nav-links">
        <Link to="/student/dashboard">Dashboard</Link>
        <button onClick={() => { clearStudent(); nav("/student/login"); }}>Logout</button>
      </div>
    </nav>
  );
}
