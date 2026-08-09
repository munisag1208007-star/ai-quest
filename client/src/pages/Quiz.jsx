import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import "./Quiz.css";

export default function Quiz() {
  const { topicId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // { correct, correctIndex, explanation }
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api
      .getQuiz(token, topicId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, topicId]);

  function pick(index) {
    if (revealed) return;
    setSelected(index);
  }

  // 정답은 클라이언트가 갖고 있지 않다. 서버에 물어보고 결과(정답 여부/정답 위치/해설)를 받는다.
  async function confirmAnswer() {
    if (selected === null || checking) return;
    setChecking(true);
    try {
      const res = await api.checkQuizAnswer(token, topicId, { index: current, selected });
      setCheckResult(res);
      setRevealed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setChecking(false);
    }
  }

  async function next() {
    if (current + 1 < data.questions.length) {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
      setCheckResult(null);
      return;
    }

    // 마지막 문제까지 다 풀었으면 최종 제출. 점수는 서버가 자체적으로 집계한 채점 기록으로 계산한다.
    try {
      const res = await api.submitQuiz(token, topicId);
      setResult(res);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page quiz-loading">
          <span className="spinner" />
          <span className="mono">퀴즈를 만드는 중이에요...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="page">
          <div className="card learn-error">
            <p className="error-text">{error}</p>
          </div>
        </div>
      </>
    );
  }

  if (result) {
    return (
      <>
        <Navbar />
        <div className="page quiz-result-page">
          <div className={`card quiz-result-card ${result.passed ? "passed" : "failed"} fade-in`}>
            <p className="eyebrow">{result.passed ? "완료" : "다시 도전"}</p>
            <h1 className="quiz-result-score">{result.percent}%</h1>
            <p className="quiz-result-detail">
              {result.score} / {result.total} 문제 정답
            </p>
            <p className="quiz-result-msg">
              {result.passed
                ? "훌륭해요! 이 주제를 완료했어요."
                : "60% 이상 맞히면 완료돼요. 학습 내용을 다시 살펴보고 재도전해보세요."}
            </p>
            <div className="quiz-result-actions">
              <button className="btn btn-ghost" onClick={() => navigate("/")}>주제 목록</button>
              <button className="btn btn-primary" onClick={() => navigate(`/learn/${topicId}`)}>
                다시 학습하기
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const q = data.questions[current];

  return (
    <>
      <Navbar />
      <div className="page quiz-page">
        <div className="quiz-progress">
          <span className="mono">문제 {current + 1} / {data.questions.length}</span>
          <div className="quiz-progress-bar">
            <div
              className="quiz-progress-fill"
              style={{ width: `${((current + (revealed ? 1 : 0)) / data.questions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="card quiz-question-card fade-in" key={current}>
          <h2 className="quiz-question">{q.question}</h2>
          <div className="quiz-options">
            {q.options.map((opt, i) => {
              let cls = "quiz-option";
              if (revealed && checkResult) {
                if (i === checkResult.correctIndex) cls += " correct";
                else if (i === selected) cls += " wrong";
              } else if (i === selected) {
                cls += " selected";
              }
              return (
                <button key={i} className={cls} onClick={() => pick(i)} disabled={revealed}>
                  <span className="quiz-option-letter mono">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>

          {revealed && checkResult && (
            <p className="quiz-explanation fade-in">{checkResult.explanation}</p>
          )}

          <div className="quiz-actions">
            {!revealed ? (
              <button className="btn btn-primary" disabled={selected === null || checking} onClick={confirmAnswer}>
                {checking ? "확인 중..." : "정답 확인"}
              </button>
            ) : (
              <button className="btn btn-primary" onClick={next}>
                {current + 1 < data.questions.length ? "다음 문제" : "결과 보기"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
