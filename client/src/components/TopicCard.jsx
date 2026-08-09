import { useNavigate } from "react-router-dom";
import "./TopicCard.css";

const STATUS_LABEL = {
  not_started: "시작 전",
  learning: "학습 중",
  completed: "완료"
};

export default function TopicCard({ topic, index }) {
  const navigate = useNavigate();

  return (
    <button
      className={`topic-card status-${topic.status}`}
      style={{ "--accent": topic.color }}
      onClick={() => navigate(`/learn/${topic.id}`)}
    >
      <span className="topic-card-ghost mono" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className="topic-card-top">
        <span className="topic-card-node" aria-hidden="true">
          <svg viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" />
            <circle cx="10" cy="10" r="3" />
          </svg>
        </span>
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
  );
}
