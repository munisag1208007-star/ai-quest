import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import SocialButtons from "../components/SocialButtons.jsx";
import "./Auth.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.signup({ name, email, password });
      loginSuccess(data);
      navigate("/welcome");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card fade-in">
        <p className="eyebrow">AI QUEST</p>
        <h1 className="auth-title">계정 만들기</h1>
        <p className="auth-sub">몇 초면 시작할 수 있어요.</p>

        <SocialButtons />

        <div className="auth-divider"><span>또는 이메일로 가입</span></div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">이름</label>
            <input id="name" required value={name}
              onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
          </div>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input id="password" type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="6자 이상" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "회원가입"}
          </button>
        </form>

        <p className="auth-switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
