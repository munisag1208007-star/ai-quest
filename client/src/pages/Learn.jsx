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
  const [pageIndex, setPageIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");
  const [chatLog, setChatLog] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    setPageIndex(0);
    setChatLog([]);
    api
      .getContent(token, topicId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, topicId]);

  const pages = data?.pages || [];
  const currentPage = pages[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === pages.length - 1;

  async function handleAsk(e) {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;

    setAsking(true);
    setAskError("");
    try {
      const res = await api.askAboutTopic(token, topicId, q);
      setChatLog((prev) => [...prev, { question: q, answer: res.answer }]);
      setQuestion("");
    } catch (err) {
      setAskError(err.message);
    } finally {
      setAsking(false);
    }
  }

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
              GROQ API 키가 서버 .env에 올바르게 설정돼 있는지 확인해주세요.
            </p>
          </div>
        )}

        {data && currentPage && (
          <div className="fade-in">
            <p className="eyebrow">{data.topic.maker}</p>
            <h1 className="learn-title" style={{ color: data.topic.color }}>
              {data.topic.name}
            </h1>

            <div className="learn-page-dots">
              {pages.map((p, i) => (
                <button
                  key={i}
                  className={`learn-dot ${i === pageIndex ? "active" : ""}`}
                  style={i === pageIndex ? { background: data.topic.color } : {}}
                  onClick={() => setPageIndex(i)}
                  aria-label={`${i + 1}페이지: ${p.title}`}
                  type="button"
                />
              ))}
            </div>

            <div className="card learn-content">
              <p className="learn-page-count">
                {pageIndex + 1} / {pages.length}
              </p>
              <h2 className="learn-page-title">{currentPage.title}</h2>
              <p className="learn-page-summary">{currentPage.summary}</p>

              <div className="learn-visual-grid">
                {currentPage.visualItems.map((v, i) => (
                  <div key={i} className="learn-visual-card">
                    <span className="learn-visual-emoji">{v.emoji}</span>
                    <p className="learn-visual-label">{v.label}</p>
                    <p className="learn-visual-desc">{v.description}</p>
                  </div>
                ))}
              </div>

              <div className="learn-body">
                <ReactMarkdown>{currentPage.body}</ReactMarkdown>
              </div>
            </div>

            <div className="learn-page-nav">
              <button
                className="btn btn-ghost"
                disabled={isFirst}
                onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                type="button"
              >
                ← 이전
              </button>
              {isLast ? (
                <button className="btn btn-primary" onClick={() => navigate(`/quiz/${topicId}`)} type="button">
                  퀴즈 풀어보기 →
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setPageIndex((i) => Math.min(pages.length - 1, i + 1))}
                  type="button"
                >
                  다음 →
                </button>
              )}
            </div>

            <div className="card learn-ask">
              <h3 className="learn-ask-title">모르는 부분이 있나요? AI에게 물어보세요</h3>

              {chatLog.length > 0 && (
                <div className="learn-ask-log">
                  {chatLog.map((item, i) => (
                    <div key={i} className="learn-ask-item">
                      <p className="learn-ask-question">Q. {item.question}</p>
                      <p className="learn-ask-answer">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}

              {askError && <p className="error-text">{askError}</p>}

              <form className="learn-ask-form" onSubmit={handleAsk}>
                <input
                  type="text"
                  className="input"
                  placeholder="예: 왜 이게 중요한가요?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  maxLength={500}
                  disabled={asking}
                />
                <button className="btn btn-primary" type="submit" disabled={asking || !question.trim()}>
                  {asking ? "답변 생성 중..." : "질문하기"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
