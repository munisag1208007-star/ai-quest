import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import "./Learn.css";

export default function Learn() {
  const { topicId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getContent(token, topicId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, topicId]);

  return (
    <>
      <Navbar />
      <div className="page learn-page">
        <button className="btn btn-ghost learn-back" onClick={() => navigate("/")}>
          ← 주제 목록
        </button>

        {loading && (
          <div className="learn-loading">
            <span className="spinner" />
            <span className="mono">AI가 설명을 생성하고 있어요...</span>
          </div>
        )}

        {error && (
          <div className="card learn-error">
            <p className="error-text">{error}</p>
            <p className="learn-error-hint">
              Gemini API 키가 서버 .env에 올바르게 설정돼 있는지 확인해주세요.
            </p>
          </div>
        )}

        {data && (
          <div className="fade-in">
            <p className="eyebrow">{data.topic.maker}</p>
            <h1 className="learn-title" style={{ color: data.topic.color }}>
              {data.topic.name}
            </h1>

            <div className="card learn-content">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>

            <button className="btn btn-primary learn-quiz-btn" onClick={() => navigate(`/quiz/${topicId}`)}>
              퀴즈 풀어보기 →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
