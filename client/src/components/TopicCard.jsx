import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TopicCard.css";

const STATUS_LABEL = {
  not_started: "시작 전",
  learning: "학습 중",
  completed: "완료"
};

function hexToRgb(hex) {
  if (!hex) return "245, 166, 35";
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

function TopicLogo({ id, color }) {
  switch (id) {
    case "claude":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="claudeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="glowClaude" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path
            d="M24 4 L28.5 17.5 L42 18 L31.5 26.5 L35 40 L24 31.5 L13 40 L16.5 26.5 L6 18 L19.5 17.5 Z"
            fill="url(#claudeGrad)"
            filter="url(#glowClaude)"
          />
          <circle cx="24" cy="24" r="5" fill="#FFF" opacity="0.9" />
        </svg>
      );
    case "chatgpt":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="gptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <g transform="translate(24, 24)" fill="none" stroke="url(#gptGrad)" strokeWidth="3" strokeLinecap="round">
            <circle cx="0" cy="0" r="18" strokeDasharray="6 4" opacity="0.4" />
            <path d="M0 -15 A15 15 0 0 1 13 7.5 L5 2.8" />
            <path d="M0 -15 A15 15 0 0 1 13 7.5 L5 2.8" transform="rotate(60)" />
            <path d="M0 -15 A15 15 0 0 1 13 7.5 L5 2.8" transform="rotate(120)" />
            <path d="M0 -15 A15 15 0 0 1 13 7.5 L5 2.8" transform="rotate(180)" />
            <path d="M0 -15 A15 15 0 0 1 13 7.5 L5 2.8" transform="rotate(240)" />
            <path d="M0 -15 A15 15 0 0 1 13 7.5 L5 2.8" transform="rotate(300)" />
            <circle cx="0" cy="0" r="4" fill="#6EE7B7" stroke="none" />
          </g>
        </svg>
      );
    case "gemini":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>
          <path
            d="M24 4 C24 15 15 24 4 24 C15 24 24 33 24 44 C24 33 33 24 44 24 C33 24 24 15 24 4 Z"
            fill="url(#gemGrad)"
          />
          <path
            d="M24 12 C24 18 18 24 12 24 C18 24 24 30 24 36 C24 30 30 24 36 24 C30 24 24 18 24 12 Z"
            fill="#FFF"
            opacity="0.8"
          />
        </svg>
      );
    case "grok":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="grokGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>
          <rect x="8" y="8" width="32" height="32" rx="8" fill="url(#grokGrad)" opacity="0.15" />
          <path d="M12 12 L36 36 M36 12 L12 36" stroke="url(#grokGrad)" strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="24" cy="24" r="5" fill="#F87171" />
        </svg>
      );
    case "ai-agent":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="agentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke="url(#agentGrad)" strokeWidth="2" transform="rotate(-25 24 24)" opacity="0.7" />
          <ellipse cx="24" cy="24" rx="18" ry="7" fill="none" stroke="url(#agentGrad)" strokeWidth="2" transform="rotate(35 24 24)" opacity="0.7" />
          <circle cx="24" cy="24" r="9" fill="url(#agentGrad)" />
          <circle cx="21" cy="22" r="2.5" fill="#FFF" />
          <circle cx="27" cy="22" r="2.5" fill="#FFF" />
        </svg>
      );
    case "prompt-engineering":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="promptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
          </defs>
          <rect x="6" y="10" width="36" height="28" rx="6" fill="#1E293B" stroke="url(#promptGrad)" strokeWidth="2" />
          <path d="M14 20 L20 24 L14 28" fill="none" stroke="url(#promptGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="24" y1="28" x2="32" y2="28" stroke="url(#promptGrad)" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case "generative-ai":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="genGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>
          <polygon points="24,6 40,15 40,33 24,42 8,33 8,15" fill="url(#genGrad)" opacity="0.25" stroke="url(#genGrad)" strokeWidth="2" />
          <polygon points="24,6 40,15 24,24 8,15" fill="url(#genGrad)" opacity="0.6" />
          <polygon points="24,24 40,15 40,33 24,42" fill="url(#genGrad)" opacity="0.4" />
          <polygon points="24,24 8,15 8,33 24,42" fill="url(#genGrad)" opacity="0.8" />
        </svg>
      );
    case "ai-ethics":
      return (
        <svg viewBox="0 0 48 48" className="topic-3d-svg">
          <defs>
            <linearGradient id="ethicsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
          <path d="M24 6 L38 12 V22 C38 32 24 40 24 40 C24 40 10 32 10 22 V12 L24 6 Z" fill="url(#ethicsGrad)" opacity="0.2" stroke="url(#ethicsGrad)" strokeWidth="2" />
          <path d="M24 16 C21 13 16 14 16 18 C16 23 24 28 24 28 C24 28 32 23 32 18 C32 14 27 13 24 16 Z" fill="url(#ethicsGrad)" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TopicCard({ topic, index }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50 });

  function handleMouseMove(e) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const width = rect.width;
    const height = rect.height;

    const pctX = Math.round((x / width) * 100);
    const pctY = Math.round((y / height) * 100);

    const rotateY = Math.round(((x / width) - 0.5) * 24);
    const rotateX = Math.round(-((y / height) - 0.5) * 24);

    setTilt({ rotateX, rotateY, spotX: pctX, spotY: pctY });
  }

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50 });
  }

  function handleTouchStart(e) {
    if (!cardRef.current) return;
    setIsHovered(true);
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const pctX = Math.round((x / rect.width) * 100);
    const pctY = Math.round((y / rect.height) * 100);
    const rotateY = Math.round(((x / rect.width) - 0.5) * 16);
    const rotateX = Math.round(-((y / rect.height) - 0.5) * 16);
    setTilt({ rotateX, rotateY, spotX: pctX, spotY: pctY });
  }

  function handleTouchMove(e) {
    if (!cardRef.current) return;
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const pctX = Math.round((x / rect.width) * 100);
      const pctY = Math.round((y / rect.height) * 100);
      const rotateY = Math.round(((x / rect.width) - 0.5) * 16);
      const rotateX = Math.round(-((y / rect.height) - 0.5) * 16);
      setTilt({ rotateX, rotateY, spotX: pctX, spotY: pctY });
    }
  }

  function handleTouchEnd() {
    setTimeout(() => {
      setIsHovered(false);
      setTilt({ rotateX: 0, rotateY: 0, spotX: 50, spotY: 50 });
    }, 250);
  }

  const rgb = hexToRgb(topic.color);

  return (
    <div className="topic-card-wrapper">
      <button
        ref={cardRef}
        className={`topic-card status-${topic.status} ${isHovered ? "is-hovered" : ""}`}
        style={{
          "--accent": topic.color,
          "--accent-rgb": rgb,
          "--rotate-x": `${tilt.rotateX}deg`,
          "--rotate-y": `${tilt.rotateY}deg`,
          "--spotlight-x": `${tilt.spotX}%`,
          "--spotlight-y": `${tilt.spotY}%`
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={() => navigate(`/learn/${topic.id}`)}
      >
        {/* 커서/터치 추적 3D 스포트라이트 조명 레이어 */}
        <div className="topic-card-spotlight" />

        {/* 테두리 굴절 시각 효과 (Specular Border Glow) */}
        <div className="topic-card-border-glow" />

        <span className="topic-card-ghost mono" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="topic-card-top">
          <div className="topic-card-3d-badge">
            <TopicLogo id={topic.id} color={topic.color} />
          </div>
          <span className={`topic-card-status status-${topic.status}`}>
            {STATUS_LABEL[topic.status]}
          </span>
        </div>

        <h3 className="topic-card-name">{topic.name}</h3>
        <p className="topic-card-maker mono">{topic.maker}</p>
        <p className="topic-card-tagline">{topic.tagline}</p>

        <div className="topic-card-footer">
          {topic.bestScore > 0 ? (
            <span className="topic-card-score mono">최고 점수 {topic.bestScore}%</span>
          ) : (
            <span className="topic-card-cta mono">학습 시작 →</span>
          )}
        </div>
      </button>
    </div>
  );
}

