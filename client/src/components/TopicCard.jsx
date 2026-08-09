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

// 대형 3D 브랜드/개념 엠블럼 로고 컴포넌트
function Large3DEmblem({ id, name, maker, color }) {
  switch (id) {
    case "claude":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="claudeMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <filter id="claudeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* 뒤 배경 3D 후광 링 */}
          <circle cx="60" cy="52" r="42" fill="#F5A623" opacity="0.08" filter="url(#claudeGlow)" />
          <circle cx="60" cy="52" r="34" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.3" />
          {/* Claude 앤스로픽 3D 별빛 스파크 엠블럼 */}
          <path
            d="M60 12 L69 40 L96 42 L74 58 L82 85 L60 69 L38 85 L46 58 L24 42 L51 40 Z"
            fill="url(#claudeMain)"
            filter="url(#claudeGlow)"
          />
          <circle cx="60" cy="52" r="8" fill="#FFF" opacity="0.95" />
        </svg>
      );
    case "chatgpt":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="gptMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6EE7B7" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="gptGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="60" cy="52" r="42" fill="#6EE7B7" opacity="0.08" filter="url(#gptGlow)" />
          {/* OpenAI 3D 노드 스파이럴 기하학 */}
          <g transform="translate(60, 52)" fill="none" stroke="url(#gptMain)" strokeWidth="4.5" strokeLinecap="round">
            <circle cx="0" cy="0" r="32" strokeDasharray="8 6" opacity="0.3" />
            <path d="M0 -28 A28 28 0 0 1 24.2 14 L9.3 5.4" />
            <path d="M0 -28 A28 28 0 0 1 24.2 14 L9.3 5.4" transform="rotate(60)" />
            <path d="M0 -28 A28 28 0 0 1 24.2 14 L9.3 5.4" transform="rotate(120)" />
            <path d="M0 -28 A28 28 0 0 1 24.2 14 L9.3 5.4" transform="rotate(180)" />
            <path d="M0 -28 A28 28 0 0 1 24.2 14 L9.3 5.4" transform="rotate(240)" />
            <path d="M0 -28 A28 28 0 0 1 24.2 14 L9.3 5.4" transform="rotate(300)" />
            <circle cx="0" cy="0" r="7" fill="#6EE7B7" stroke="none" />
          </g>
        </svg>
      );
    case "gemini":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="gemMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
            <filter id="gemGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="60" cy="52" r="44" fill="#7DD3FC" opacity="0.08" filter="url(#gemGlow)" />
          {/* 구글 제미나이 4-포인트 3D 다이아몬드 스파클 */}
          <path
            d="M60 12 C60 34 38 52 16 52 C38 52 60 70 60 92 C60 70 82 52 104 52 C82 52 60 34 60 12 Z"
            fill="url(#gemMain)"
            filter="url(#gemGlow)"
          />
          <path
            d="M60 28 C60 41 47 52 34 52 C47 52 60 63 60 76 C60 63 73 52 86 52 C73 52 60 41 60 28 Z"
            fill="#FFF"
            opacity="0.95"
          />
        </svg>
      );
    case "grok":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="grokMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F87171" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
            <filter id="grokGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* xAI Grok 슬릭 X 3D 실드 */}
          <rect x="20" y="12" width="80" height="80" rx="20" fill="url(#grokMain)" opacity="0.15" />
          <rect x="24" y="16" width="72" height="72" rx="16" fill="none" stroke="url(#grokMain)" strokeWidth="2" opacity="0.4" />
          <path d="M30 22 L90 82 M90 22 L30 82" stroke="url(#grokMain)" strokeWidth="9" strokeLinecap="round" filter="url(#grokGlow)" />
          <circle cx="60" cy="52" r="10" fill="#F87171" />
        </svg>
      );
    case "ai-agent":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="agentMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C4B5FD" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="agentGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* AI 에이전트 자율 보트 크리스탈 구체 & 궤도 링 */}
          <ellipse cx="60" cy="52" rx="42" ry="16" fill="none" stroke="url(#agentMain)" strokeWidth="3" transform="rotate(-25 60 52)" opacity="0.65" />
          <ellipse cx="60" cy="52" rx="42" ry="16" fill="none" stroke="url(#agentMain)" strokeWidth="3" transform="rotate(35 60 52)" opacity="0.65" />
          <circle cx="60" cy="52" r="22" fill="url(#agentMain)" filter="url(#agentGlow)" />
          <circle cx="53" cy="47" r="5" fill="#FFF" />
          <circle cx="67" cy="47" r="5" fill="#FFF" />
        </svg>
      );
    case "prompt-engineering":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="promptMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDBA74" />
              <stop offset="100%" stopColor="#EA580C" />
            </linearGradient>
            <filter id="promptGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* 프롬프트 엔지니어링 3D 터미널 커맨드 블록 */}
          <rect x="18" y="20" width="84" height="64" rx="14" fill="#0F172A" stroke="url(#promptMain)" strokeWidth="3.5" filter="url(#promptGlow)" />
          <path d="M34 42 L48 52 L34 62" fill="none" stroke="url(#promptMain)" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="58" y1="62" x2="80" y2="62" stroke="url(#promptMain)" strokeWidth="5.5" strokeLinecap="round" />
        </svg>
      );
    case "generative-ai":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="genMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A7F3D0" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="genGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* 생성형 AI 3D 프리즘 크리스탈 다면체 */}
          <polygon points="60,12 100,32 100,72 60,92 20,72 20,32" fill="url(#genMain)" opacity="0.2" stroke="url(#genMain)" strokeWidth="3" filter="url(#genGlow)" />
          <polygon points="60,12 100,32 60,52 20,32" fill="url(#genMain)" opacity="0.75" />
          <polygon points="60,52 100,32 100,72 60,92" fill="url(#genMain)" opacity="0.5" />
          <polygon points="60,52 20,32 20,72 60,92" fill="url(#genMain)" opacity="0.9" />
        </svg>
      );
    case "ai-ethics":
      return (
        <svg viewBox="0 0 120 120" className="large-emblem-svg">
          <defs>
            <linearGradient id="ethicsMain" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCA5A5" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
            <filter id="ethicsGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {/* AI 윤리 3D 정스티스 실드 & 회로 하트 */}
          <path d="M60 12 L96 26 V48 C96 70 60 88 60 88 C60 88 24 70 24 48 V26 L60 12 Z" fill="url(#ethicsMain)" opacity="0.25" stroke="url(#ethicsMain)" strokeWidth="3.5" filter="url(#ethicsGlow)" />
          <path d="M60 34 C53 27 41 29 41 39 C41 50 60 62 60 62 C60 62 79 50 79 39 C79 29 67 27 60 34 Z" fill="url(#ethicsMain)" />
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

    const rotateY = Math.round(((x / width) - 0.5) * 26);
    const rotateX = Math.round(-((y / height) - 0.5) * 26);

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
    const rotateY = Math.round(((x / rect.width) - 0.5) * 18);
    const rotateX = Math.round(-((y / rect.height) - 0.5) * 18);
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
      const rotateY = Math.round(((x / rect.width) - 0.5) * 18);
      const rotateX = Math.round(-((y / rect.height) - 0.5) * 18);
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
        className={`topic-emblem-card status-${topic.status} ${isHovered ? "is-hovered" : ""}`}
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

        {/* 테두리 굴절 스펙큘러 라이트 */}
        <div className="topic-card-border-glow" />

        {/* 넘버링 워터마크 */}
        <span className="topic-card-ghost mono" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* 상단 상태 뱃지 */}
        <div className="emblem-card-header">
          <span className={`topic-card-status status-${topic.status}`}>
            {STATUS_LABEL[topic.status]}
          </span>
        </div>

        {/* 카드 중앙: 대형 3D 브랜드 엠블럼 스파크 */}
        <div className="hero-emblem-container">
          <Large3DEmblem id={topic.id} name={topic.name} maker={topic.maker} color={topic.color} />
          
          {/* 엠블럼 일체형 브랜드 타이틀 & 메이커 태그 */}
          <div className="emblem-integrated-title">
            <h3 className="emblem-title-text" style={{ color: topic.color }}>
              {topic.name}
            </h3>
            <span className="emblem-maker-badge mono">{topic.maker}</span>
          </div>
        </div>

        {/* 카드의 슬림 하단 설명 & 버튼 */}
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


