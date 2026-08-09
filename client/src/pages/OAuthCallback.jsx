import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";

// 백엔드가 소셜 로그인 처리 후 /oauth/callback?token=...&firstLogin=1 로 리다이렉트 시킴.
// 여기서 토큰을 받아 로그인 상태로 저장하고, 실제 프로필을 불러온 뒤 적절한 페이지로 이동.
export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    const firstLogin = params.get("firstLogin") === "1";

    if (!token) {
      navigate("/login?error=oauth");
      return;
    }

    (async () => {
      try {
        const { user } = await api.getMe(token);
        loginSuccess({ token, user });
        navigate(firstLogin ? "/welcome" : "/");
      } catch {
        // 토큰은 받았지만 프로필 조회에 실패한 경우, 이름이 "학습자"로 영구히 남는 것보다
        // 다시 로그인하도록 안내하는 편이 안전하다.
        navigate("/login?error=oauth");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="auth-page">
      <div className="mono" style={{ color: "var(--muted)" }}>로그인 처리 중...</div>
    </div>
  );
}
