import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import "./QuizArena.css";

const QUESTION_TIMER_SEC = 30;

export default function QuizArena() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [gameState, setGameState] = useState("idle"); // 'idle' | 'loading' | 'playing' | 'result'
  const [sessionId, setSessionId] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [userSelections, setUserSelections] = useState({});
  const [timerLeft, setTimerLeft] = useState(QUESTION_TIMER_SEC);

  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [speedBonusTotal, setSpeedBonusTotal] = useState(0);

  const [feedbackState, setFeedbackState] = useState(null); // { isCorrect, selectedIdx }
  const [submitting, setSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const [error, setError] = useState("");

  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const questionStartTimeRef = useRef(Date.now());

  // 타이머 틱
  useEffect(() => {
    if (gameState !== "playing" || feedbackState) return;

    timerRef.current = setInterval(() => {
      setTimerLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, currentIndex, feedbackState]);

  const handleStartArena = async () => {
    setGameState("loading");
    setError("");
    setSelectedAnswers({});
    setUserSelections({});
    setCurrentIndex(0);
    setCombo(0);
    setMaxCombo(0);
    setTotalScore(0);
    setSpeedBonusTotal(0);
    setFeedbackState(null);

    try {
      const data = await api.getArenaQuestions(token);
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setGameState("playing");
      setTimerLeft(QUESTION_TIMER_SEC);
      startTimeRef.current = Date.now();
      questionStartTimeRef.current = Date.now();
    } catch (err) {
      setError(err.message || "아레나 퀴즈를 불러오는 중 오류가 발생했습니다.");
      setGameState("idle");
    }
  };

  const handleTimeOut = () => {
    // 시간 초과 시 무응답 처리 후 다음 문제로 진행
    const nextAnswers = { ...userSelections, [currentIndex]: -1 };
    setUserSelections(nextAnswers);
    setCombo(0); // 콤보 초기화

    moveToNextQuestion(nextAnswers);
  };

  const handleSelectOption = (optionIndex) => {
    if (feedbackState || gameState !== "playing") return;
    clearInterval(timerRef.current);

    const timeSpentOnQuestion = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000));
    const isFast = timerLeft >= 15; // 15초 이상 남아있을 때 빠른 정답

    const nextSelections = { ...userSelections, [currentIndex]: optionIndex };
    setUserSelections(nextSelections);

    setFeedbackState({ selectedIdx: optionIndex });

    setTimeout(() => {
      setFeedbackState(null);
      moveToNextQuestion(nextSelections);
    }, 800);
  };

  const moveToNextQuestion = (latestSelections) => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setTimerLeft(QUESTION_TIMER_SEC);
      questionStartTimeRef.current = Date.now();
    } else {
      finishArenaGame(latestSelections);
    }
  };

  const finishArenaGame = async (finalSelections) => {
    setGameState("submitting");
    setSubmitting(true);
    const totalTimeSpentSec = Math.max(5, Math.round((Date.now() - startTimeRef.current) / 1000));

    try {
      const res = await api.submitArenaScore(token, {
        sessionId,
        answers: finalSelections,
        timeSpentSec: totalTimeSpentSec
      });

      setFinalResult(res);
      setGameState("result");
    } catch (err) {
      setError("결과 제출 실패: " + err.message);
      setGameState("idle");
    } finally {
      setSubmitting(false);
    }
  };

  const getTierInfo = (score) => {
    if (score >= 900) return { tier: "🏆 S급 퀴즈 마스터", color: "#f5a623", desc: "압도적인 속도와 정확도를 지닌 AI 전문가!" };
    if (score >= 700) return { tier: "🥇 A급 스피드 데몬", color: "#6ee7b7", desc: "빠른 판단력과 뛰어난 개념 이해력!" };
    if (score >= 400) return { tier: "🥈 B급 숙련 학습자", color: "#7dd3fc", desc: "안정적인 실력을 갖춘 AI 탐구자!" };
    return { tier: "🥉 C급 유망 입문자", color: "#a78bfa", desc: "차근차근 실력을 쌓아가는 무한한 가능성!" };
  };

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        {/* LOBBY STATE */}
        {gameState === "idle" && (
          <div className="arena-lobby card text-center">
            <div className="arena-badge-icon">⚔️</div>
            <p className="eyebrow">TIME ATTACK SURVIVAL</p>
            <h1 className="arena-title">AI 스피드 퀴즈 아레나</h1>
            <p className="arena-desc">
              제한시간 30초! 무작위 AI 퀴즈 5문항에 연속 도전하세요.<br />
              빠르게 맞힐수록 <b>속도 보너스</b>와 <b>연속 콤보 점수</b>가 폭발합니다!
            </p>

            <div className="arena-rules">
              <div className="rule-item">
                <span className="rule-icon">⏱️</span>
                <span>문제당 30초 카운트다운</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">🔥</span>
                <span>연속 정답 시 콤보 점수 증폭</span>
              </div>
              <div className="rule-item">
                <span className="rule-icon">📝</span>
                <span>틀린 문제는 자동으로 오답 노트 저장</span>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="btn btn-primary arena-start-btn" onClick={handleStartArena}>
              🔥 타임어택 서바이벌 시작!
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {gameState === "loading" && (
          <div className="arena-loading card">
            <div className="pulse-circle"></div>
            <h2 className="loading-title">⚔️ AI 아레나 전장 세팅 중...</h2>
            <p className="mono text-muted">무작위 주제에서 흥미진진한 스피드 문제 5개를 생성하고 있습니다.</p>
          </div>
        )}

        {/* PLAYING STATE */}
        {gameState === "playing" && questions.length > 0 && (
          <div className="arena-play-wrapper">
            <div className="arena-hud card">
              <div className="hud-header">
                <span className="hud-topic mono">
                  📍 {questions[currentIndex]?.topicName || "무작위 주제"}
                </span>
                <span className="hud-progress mono">
                  QUESTION <b>{currentIndex + 1}</b> / {questions.length}
                </span>
              </div>

              {/* 타이머 바 */}
              <div className="timer-bar-container">
                <div
                  className={`timer-bar ${timerLeft <= 5 ? "timer-urgent" : ""}`}
                  style={{ width: `${(timerLeft / QUESTION_TIMER_SEC) * 100}%` }}
                ></div>
              </div>

              <div className="hud-timer-num mono">
                ⏱️ {timerLeft}s
              </div>
            </div>

            {/* 질문 카드 */}
            <div className="arena-question-card card">
              <h2 className="q-title">{questions[currentIndex]?.question}</h2>

              <div className="q-options">
                {questions[currentIndex]?.options.map((opt, idx) => {
                  let optClass = "q-opt-btn";
                  if (feedbackState?.selectedIdx === idx) {
                    optClass += " selected";
                  }

                  return (
                    <button
                      key={idx}
                      className={optClass}
                      onClick={() => handleSelectOption(idx)}
                      disabled={feedbackState !== null}
                    >
                      <span className="opt-num mono">{idx + 1}</span>
                      <span className="opt-text">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUBMITTING STATE */}
        {gameState === "submitting" && (
          <div className="arena-loading card">
            <div className="pulse-circle"></div>
            <h2>📊 경기 채점 및 점수 산출 중...</h2>
          </div>
        )}

        {/* RESULT STATE */}
        {gameState === "result" && finalResult && (
          <div className="arena-result-wrapper fade-in">
            <div className="arena-score-card card text-center">
              <p className="eyebrow">ARENA MATCH COMPLETED</p>

              {(() => {
                const tier = getTierInfo(finalResult.score);
                return (
                  <>
                    <h1 className="tier-name" style={{ color: tier.color }}>
                      {tier.tier}
                    </h1>
                    <p className="tier-desc">{tier.desc}</p>
                  </>
                );
              })()}

              <div className="final-score-display">
                <span className="score-val mono">{finalResult.score}</span>
                <span className="score-unit">PTS</span>
              </div>

              <div className="score-stats-grid">
                <div className="stat-box">
                  <span className="stat-label">🎯 맞힌 문제</span>
                  <span className="stat-value mono">{finalResult.correctCount} / {finalResult.totalCount}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">⏱️ 총 소요 시간</span>
                  <span className="stat-value mono">{finalResult.timeSpentSec}초</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">🔥 백엔드 랭킹 반영</span>
                  <span className="stat-value mono">완료됨</span>
                </div>
              </div>

              <div className="result-actions">
                <button className="btn btn-primary" onClick={handleStartArena}>
                  ⚔️ 다시 도전하기
                </button>
                <button className="btn btn-secondary" onClick={() => navigate("/leaderboard")}>
                  🏆 명예의 전당 (리더보드)
                </button>
                <button className="btn btn-ghost" onClick={() => navigate("/review")}>
                  📝 틀린 문제 오답 노트 보기
                </button>
              </div>
            </div>

            {/* 정답 해설 검토 목록 */}
            <div className="arena-review-list card">
              <h3>📋 아레나 경기 문제 및 해설 검토</h3>
              <div className="review-items">
                {finalResult.questionsWithAnswers?.map((q, idx) => {
                  const userSel = userSelections[idx];
                  const isCorrect = userSel === q.correctIndex;

                  return (
                    <div key={idx} className={`review-item ${isCorrect ? "correct" : "wrong"}`}>
                      <div className="review-item-header">
                        <span className="review-q-num mono">Q{idx + 1}. [{q.topicName || "아레나"}]</span>
                        <span className={`review-tag ${isCorrect ? "tag-pass" : "tag-fail"}`}>
                          {isCorrect ? "✅ 정답 (+200pt)" : "❌ 오답 (오답노트 자동 저장)"}
                        </span>
                      </div>
                      <h4 className="review-q-text">{q.question}</h4>

                      <div className="review-options">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={oIdx}
                            className={`review-opt ${oIdx === q.correctIndex ? "is-correct" : ""} ${
                              oIdx === userSel && !isCorrect ? "is-user-wrong" : ""
                            }`}
                          >
                            <span className="mono">{oIdx + 1}.</span> {opt}
                            {oIdx === q.correctIndex && <span className="tag-correct-mark"> (정답)</span>}
                            {oIdx === userSel && !isCorrect && <span className="tag-wrong-mark"> (내가 선택함)</span>}
                          </div>
                        ))}
                      </div>

                      <div className="review-explanation">
                        💡 <b>해설:</b> {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
