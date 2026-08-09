import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import "./Review.css";

export default function Review() {
  const { token } = useAuth();
  const [wrongAnswers, setWrongAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("unmastered"); // 'all' | 'unmastered' | 'mastered'

  // 다시 풀어보기 연습 모달 상태
  const [practiceItem, setPracticeItem] = useState(null);
  const [selectedPracticeOption, setSelectedPracticeOption] = useState(null);
  const [practiceChecked, setPracticeChecked] = useState(false);

  useEffect(() => {
    loadReviewData();
  }, [token]);

  const loadReviewData = async () => {
    setLoading(true);
    try {
      const data = await api.getWrongAnswers(token);
      setWrongAnswers(data.wrongAnswers || []);
    } catch (err) {
      setError(err.message || "오답 노트를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMasterItem = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.masterWrongAnswer(token, id);
      setWrongAnswers((prev) =>
        prev.map((item) => (item.id === id ? { ...item, mastered: 1 } : item))
      );
      if (practiceItem?.id === id) {
        setPracticeItem(null);
      }
    } catch (err) {
      alert("복습 완료 처리 실패: " + err.message);
    }
  };

  const handleDeleteItem = async (id, e) => {
    if (e) e.stopPropagation();
    if (!confirm("이 오답 항목을 오답 노트에서 삭제하시겠습니까?")) return;
    try {
      await api.deleteWrongAnswer(token, id);
      setWrongAnswers((prev) => prev.filter((item) => item.id !== id));
      if (practiceItem?.id === id) {
        setPracticeItem(null);
      }
    } catch (err) {
      alert("오답 삭제 실패: " + err.message);
    }
  };

  const openPracticeModal = (item) => {
    setPracticeItem(item);
    setSelectedPracticeOption(null);
    setPracticeChecked(false);
  };

  const handleCheckPractice = (idx) => {
    if (practiceChecked) return;
    setSelectedPracticeOption(idx);
    setPracticeChecked(true);
  };

  const filteredList = wrongAnswers.filter((item) => {
    if (activeTab === "unmastered") return item.mastered === 0;
    if (activeTab === "mastered") return item.mastered === 1;
    return true;
  });

  const unmasteredCount = wrongAnswers.filter((i) => i.mastered === 0).length;
  const masteredCount = wrongAnswers.filter((i) => i.mastered === 1).length;

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <header className="review-header">
          <div>
            <p className="eyebrow">REVIEW & MISTAKES</p>
            <h1 className="review-title">📝 오답 노트 & 스크랩북</h1>
            <p className="review-sub">
              퀴즈와 아레나에서 틀렸던 질문과 해설을 모아 복습하고, 다시 풀어보며 완전히 내 지식으로 만드세요.
            </p>
          </div>
        </header>

        {/* 요약 칩 바 */}
        <section className="review-stats-bar card">
          <div className="r-stat">
            <span className="r-stat-label">전체 오답 수</span>
            <span className="r-stat-val mono">{wrongAnswers.length}개</span>
          </div>
          <div className="r-stat">
            <span className="r-stat-label">복습 필요</span>
            <span className="r-stat-val unmastered mono">{unmasteredCount}개</span>
          </div>
          <div className="r-stat">
            <span className="r-stat-label">복습 마스터 완료</span>
            <span className="r-stat-val mastered mono">{masteredCount}개</span>
          </div>
        </section>

        {/* 탭 네비게이션 */}
        <div className="review-tabs">
          <button
            className={`tab-btn ${activeTab === "unmastered" ? "active" : ""}`}
            onClick={() => setActiveTab("unmastered")}
          >
            🔥 복습 필요 ({unmasteredCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "mastered" ? "active" : ""}`}
            onClick={() => setActiveTab("mastered")}
          >
            ✅ 복습 완료 ({masteredCount})
          </button>
          <button
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            전체 오답 ({wrongAnswers.length})
          </button>
        </div>

        {loading && <p className="mono review-status">오답 노트 데이터를 불러오는 중...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <>
            {filteredList.length === 0 ? (
              <div className="review-empty card text-center">
                <div className="empty-icon">🎉</div>
                <h3>{activeTab === "unmastered" ? "복습이 필요한 틀린 문제가 없습니다!" : "오답 기록이 없습니다."}</h3>
                <p className="mono text-muted">
                  {activeTab === "unmastered"
                    ? "모든 오답을 완벽하게 마스터했거나 퀴즈를 모두 맞혔습니다."
                    : "새로운 주제를 탐구하거나 아레나 퀴즈에 도전해 보세요!"}
                </p>
              </div>
            ) : (
              <div className="review-grid">
                {filteredList.map((item) => (
                  <div
                    key={item.id}
                    className={`review-card card ${item.mastered === 1 ? "is-mastered" : ""}`}
                  >
                    <div className="rc-header">
                      <span className="rc-topic-tag mono">📍 {item.topic_id}</span>
                      <span className={`rc-status-tag ${item.mastered === 1 ? "mastered" : "unmastered"}`}>
                        {item.mastered === 1 ? "✅ 복습 마스터" : "🔥 복습 필요"}
                      </span>
                    </div>

                    <h3 className="rc-question">{item.question}</h3>

                    <div className="rc-options">
                      {item.options.map((opt, idx) => (
                        <div
                          key={idx}
                          className={`rc-opt-item ${
                            idx === item.correct_index ? "opt-correct" : idx === item.user_index ? "opt-wrong" : ""
                          }`}
                        >
                          <span className="mono">{idx + 1}.</span> {opt}
                          {idx === item.correct_index && <span className="opt-tag tag-c"> (정답)</span>}
                          {idx === item.user_index && idx !== item.correct_index && (
                            <span className="opt-tag tag-w"> (내가 제출했던 오답)</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="rc-explanation">
                      💡 <b>해설:</b> {item.explanation}
                    </div>

                    <div className="rc-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => openPracticeModal(item)}
                      >
                        ⚡ 다시 풀어보기
                      </button>

                      {item.mastered === 0 && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => handleMasterItem(item.id, e)}
                        >
                          ✅ 복습 완료 표시
                        </button>
                      )}

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => handleDeleteItem(item.id, e)}
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* 다시 풀어보기 실습 모달 */}
        {practiceItem && (
          <div className="modal-backdrop" onClick={() => setPracticeItem(null)}>
            <div className="modal-card card practice-modal" onClick={(e) => e.stopPropagation()}>
              <div className="practice-header">
                <span className="eyebrow">PRACTICE MISTAKE</span>
                <h3>⚡ 오답 복습 다시 풀어보기</h3>
              </div>

              <div className="practice-body">
                <p className="practice-q-text">{practiceItem.question}</p>

                <div className="practice-options">
                  {practiceItem.options.map((opt, idx) => {
                    let optStyle = "practice-opt-btn";
                    if (practiceChecked) {
                      if (idx === practiceItem.correct_index) optStyle += " correct-ans";
                      else if (idx === selectedPracticeOption) optStyle += " wrong-ans";
                    }

                    return (
                      <button
                        key={idx}
                        className={optStyle}
                        onClick={() => handleCheckPractice(idx)}
                        disabled={practiceChecked}
                      >
                        <span className="mono">{idx + 1}.</span> {opt}
                      </button>
                    );
                  })}
                </div>

                {practiceChecked && (
                  <div className="practice-result-box fade-in">
                    {selectedPracticeOption === practiceItem.correct_index ? (
                      <p className="p-res-correct">🎉 정답입니다! 완벽하게 기억하셨네요!</p>
                    ) : (
                      <p className="p-res-wrong">❌ 아쉽네요, 다시 해설을 확인해 보세요.</p>
                    )}
                    <p className="p-res-exp">💡 <b>해설:</b> {practiceItem.explanation}</p>
                  </div>
                )}
              </div>

              <div className="practice-footer">
                {practiceChecked && selectedPracticeOption === practiceItem.correct_index && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleMasterItem(practiceItem.id)}
                  >
                    🏆 복습 완료 처리하기
                  </button>
                )}
                <button className="btn btn-ghost" onClick={() => setPracticeItem(null)}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
