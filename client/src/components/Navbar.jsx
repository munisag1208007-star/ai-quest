import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand" onClick={() => navigate("/")}>
          <span className="navbar-mark">AQ</span>
          <span className="navbar-title">AI Quest</span>
        </div>
        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            주제
          </NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
            대시보드
          </NavLink>
        </nav>
        <div className="navbar-user">
          <span className="mono navbar-name">{user.name}</span>
          <button className="btn btn-ghost" onClick={() => { logout(); navigate("/login"); }}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
