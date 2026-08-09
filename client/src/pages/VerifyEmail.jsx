import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import "./Auth.css";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();
  const [email] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const linkButtonStyle = {
    background: "none",
    border: "none",
    padding: 0,
    font: "inherit",
    color: "inherit",
    textDecoration: "underline",
    cursor: "pointer"
  };

  if (!email) {
    return (
      <div className="auth-page">
        <div className="auth-card card fade-in">
          <p className="eyebrow">AI QUEST</p>
          <h1 className="auth-title">인증할 이메일이 없어요</h1>
          <p className="auth-sub">회원가입을 다시 진행해주세요.</p>
          <Link to="/signup" className="btn btn-primary btn-block">
            회원가입으로 이동
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.verifyEmail({ email, code });
      loginSuccess(data);
      navigate("/welcome");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setResendMsg("");
    setResending(true);
    try {
      await api.resendVerification({ email });
      setResendMsg("인증 코드를 다시 보냈어요.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card fade-in">
        <p className="eyebrow">AI QUEST</p>
        <h1 className="auth-title">이메일을 확인해주세요</h1>
        <p className="auth-sub">
          <strong>{email}</strong>로 보낸 6자리 인증 코드를 입력해주세요.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="code">인증 코드</label>
            <input
              id="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          {resendMsg && <p className="auth-sub">{resendMsg}</p>}
          <button
            className="btn btn-primary btn-block"
            disabled={loading || code.length !== 6}
          >
            {loading ? <span className="spinner" /> : "인증하기"}
          </button>
        </form>

        <p className="auth-switch">
          코드를 못 받으셨나요?{" "}
          <button
            type="button"
            style={linkButtonStyle}
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? "재전송 중..." : "재전송"}
          </button>
        </p>
      </div>
    </div>
  );
}
