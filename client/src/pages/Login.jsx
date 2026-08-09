import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import SocialButtons from "../components/SocialButtons.jsx";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const oauthError = params.get("error");
  const existingProvider = params.get("existingProvider");
  const providerLabel = { local: "이메일", kakao: "카카오", naver: "네이버", google: "구글" };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login({ email, password });
      loginSuccess(data);
      navigate(data.isFirstLogin ? "/welcome" : "/");
    } catch (err) {
      if (err.data?.needsVerification) {
        navigate("/verify-email", { state: { email } });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card card fade-in">
        <p className="eyebrow">AI QUEST</p>
        <h1 className="auth-title">다시 오셨네요</h1>
        <p className="auth-sub">로그인하고 학습을 이어가 보세요.</p>

        <SocialButtons />

        <div className="auth-divider"><span>또는 이메일로 로그인</span></div>

        {oauthError === "email_taken" && (
          <p className="error-text">
            이미 {providerLabel[existingProvider] || existingProvider}(으)로 가입된 이메일이에요.
            {" "}{providerLabel[existingProvider] || existingProvider} 로그인을 이용해주세요.
          </p>
        )}
        {oauthError && oauthError !== "email_taken" && (
          <p className="error-text">
            소셜 로그인에 실패했어요. 서버의 OAuth 설정(.env)을 확인해주세요.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">이메일</label>
            <input id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          {error && <p className="error-text">{error}</p>}
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? <span className="spinner" /> : "로그인"}
          </button>
        </form>

        <p className="auth-switch">
          아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
