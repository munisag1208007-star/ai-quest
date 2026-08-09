import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import TopicCard from "../components/TopicCard.jsx";
import "./Home.css";

export default function Home() {
  const { token } = useAuth();
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
