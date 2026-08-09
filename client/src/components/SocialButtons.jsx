import { api } from "../api.js";
import "./SocialButtons.css";

const PROVIDERS = [
  { id: "kakao", label: "카카오로 계속하기", className: "social-kakao" },
  { id: "naver", label: "네이버로 계속하기", className: "social-naver" },
  { id: "google", label: "구글로 계속하기", className: "social-google" }
];

export default function SocialButtons() {
  return (
    <div className="social-list">
      {PROVIDERS.map((p) => (
        <a key={p.id} href={api.oauthUrl(p.id)} className={`social-btn ${p.className}`}>
          <span className="social-dot" aria-hidden="true" />
          {p.label}
        </a>
      ))}
    </div>
  );
}
