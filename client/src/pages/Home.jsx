import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import TopicCard from "../components/TopicCard.jsx";
import "./Home.css";

export default function Home() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTopics(token)
      .then((data) => setTopics(data.topics))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const counts = topics.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { not_started: 0, learning: 0, completed: 0 }
  );

  return (
    <>
      <Navbar />
      <div className="page">
        <section className="hero fade-in">
          <svg className="hero-trace" viewBox="0 0 640 56" preserveAspectRatio="none" aria-hidden="true">
            <path
              className="hero-trace-line"
              d="M0 28 H130 L154 8 H298 L322 48 H466 L490 28 H640"
            />
            <circle cx="130" cy="28" r="4" className="hero-node node-amber" />
            <circle cx="298" cy="8" r="4" className="hero-node node-mint" />
            <circle cx="466" cy="48" r="4" className="hero-node node-coral" />
          </svg>

          <p className="eyebrow">
            EXPLORE · {String(topics.length || 0).padStart(2, "0")} MODULES
          </p>
          <h1 className="home-title">어떤 AI를 탐구해볼까요?</h1>
          <p className="home-sub">
            원하는 주제를 골라 학습하고, 퀴즈로 이해도를 확인해보세요.
          </p>

          {!loading && !error && topics.length > 0 && (
            <div className="hero-stats">
              <div className="stat-chip">
                <span className="stat-num mono">{counts.completed}</span>
                <span className="stat-label">완료</span>
              </div>
              <div className="stat-chip">
                <span className="stat-num mono">{counts.learning}</span>
                <span className="stat-label">학습 중</span>
              </div>
              <div className="stat-chip">
                <span className="stat-num mono">{counts.not_started}</span>
                <span className="stat-label">시작 전</span>
              </div>
            </div>
          )}
        </section>

        {/* AI Quest 주요 기능 샌드박스 & 게임 아레나 퀵 런치 hub */}
        <section className="home-hubs-section card fade-in">
          <p className="eyebrow" style={{ marginBottom: 12 }}>SPECIAL FEATURES · AI HUB</p>
          <div className="hubs-grid">
            <div className="hub-card" onClick={() => navigate("/lab")}>
              <div className="hub-icon">⚡</div>
              <div className="hub-info">
                <h4>AI 프롬프트 실습실</h4>
                <p>페르소나, Few-Shot, CoT 등 온도별 AI 실시간 테스트 샌드박스</p>
              </div>
              <span className="hub-arrow">→</span>
            </div>

            <div className="hub-card" onClick={() => navigate("/arena")}>
              <div className="hub-icon">⚔️</div>
              <div className="hub-info">
                <h4>스피드 퀴즈 아레나</h4>
                <p>30초 제한시간 타임어택! 연속 정답 콤보 서바이벌 퀴즈</p>
              </div>
              <span className="hub-arrow">→</span>
            </div>

            <div className="hub-card" onClick={() => navigate("/leaderboard")}>
              <div className="hub-icon">🏆</div>
              <div className="hub-info">
                <h4>랭킹 & 명예의 전당</h4>
                <p>학습자 종합 랭킹과 6종의 성취 뱃지 컬렉션</p>
              </div>
              <span className="hub-arrow">→</span>
            </div>

            <div className="hub-card" onClick={() => navigate("/tutor")}>
              <div className="hub-icon">🤖</div>
              <div className="hub-info">
                <h4>1:1 AI 튜터 챗</h4>
                <p>24시간 인공지능 용어/개념/코드 질문 튜터링</p>
              </div>
              <span className="hub-arrow">→</span>
            </div>

            <div className="hub-card" onClick={() => navigate("/review")}>
              <div className="hub-icon">📝</div>
              <div className="hub-info">
                <h4>오답 노트 & 스크랩</h4>
                <p>틀렸던 문항 다시 풀어보기 및 복습 관리</p>
              </div>
              <span className="hub-arrow">→</span>
            </div>
          </div>
        </section>

        {loading && <p className="mono home-status">불러오는 중...</p>}
        {error && <p className="error-text">{error}</p>}

        <div className="topic-grid">
          {topics.map((topic, i) => (
            <TopicCard key={topic.id} topic={topic} index={i} />
          ))}
        </div>
      </div>
    </>
  );
}
