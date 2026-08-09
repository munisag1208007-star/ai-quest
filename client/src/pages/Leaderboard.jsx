import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import "./Leaderboard.css";

const BADGES_DEFINITIONS = [
  {
    id: "first_step",
    name: "🏅 첫 걸음",
    desc: "첫 퀴즈를 풀고 모듈을 완료함",
    checkUnlocked: (myRank) => (myRank?.completedCount || 0) >= 1 || (myRank?.quizTotalScore || 0) > 0
  },
  {
    id: "ai_explorer",
    name: "🧠 AI 탐험가",
    desc: "3개 이상의 학습 모듈을 완료함",
    checkUnlocked: (myRank) => (myRank?.completedCount || 0) >= 3
  },
  {
    id: "prompt_master",
    name: "⚡ 프롬프트 마스터",
    desc: "프롬프트 실습실에서 템플릿 저장 및 실습 진행",
    checkUnlocked: (myRank) => (myRank?.promptCount || 0) >= 1
  },
  {
    id: "speed_demon",
    name: "⚔️ 스피드 데몬",
    desc: "퀴즈 아레나에서 500점 이상 달성",
    checkUnlocked: (myRank) => (myRank?.arenaBest || 0) >= 500
  },
  {
    id: "perfect_score",
    name: "🎯 완벽주의자",
    desc: "퀴즈 또는 아레나에서 고득점 달성",
    checkUnlocked: (myRank) => (myRank?.quizTotalScore || 0) >= 300 || (myRank?.arenaBest || 0) >= 800
  },
  {
    id: "review_master",
    name: "📚 복습 마스터",
    desc: "오답 노트에서 틀린 문제를 복습 마스터함",
    checkUnlocked: (myRank) => (myRank?.masteredCount || 0) >= 1
  }
];

export default function Leaderboard() {
  const { token, user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLeaderboard();
  }, [token]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard(token);
      setLeaderboard(data.leaderboard || []);
      setMyRank(data.myRank || null);
    } catch (err) {
      setError(err.message || "리더보드를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getRankBadgeClass = (rank) => {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "";
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <header className="lb-header">
          <div>
            <p className="eyebrow">HALL OF FAME & LEADERBOARD</p>
            <h1 className="lb-title">🏆 랭킹 & 명예의 전당</h1>
            <p className="lb-sub">
              퀴즈 점수, 학습 모듈 완료 수, 아레나 최고 기록을 합산한 종합 리더보드와 뱃지 명예의 전당입니다.
            </p>
          </div>
        </header>

        {loading && <p className="mono lb-status">리더보드 데이터를 연산 중입니다...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <div className="lb-content-wrapper">
            {/* 내 순위 카드 BARS */}
            {myRank && (
              <div className="my-rank-banner card">
                <div className="my-rank-header">
                  <div className="my-rank-badge mono">
                    내 순위: <b>#{myRank.rank}위</b> (전체 {leaderboard.length}명 중)
                  </div>
                  <div className="my-user-info">
                    <span className="my-name">{user?.name || myRank.name}</span>
                    <span className="my-score mono">{myRank.grandTotal} PTS</span>
                  </div>
                </div>

                <div className="my-rank-stats">
                  <div className="m-stat-item">
                    <span className="m-stat-label">📚 완료 모듈</span>
                    <span className="m-stat-val mono">{myRank.completedCount}개</span>
                  </div>
                  <div className="m-stat-item">
                    <span className="m-stat-label">🎯 퀴즈 점수</span>
                    <span className="m-stat-val mono">{myRank.quizTotalScore}점</span>
                  </div>
                  <div className="m-stat-item">
                    <span className="m-stat-label">⚔️ 아레나 최고점</span>
                    <span className="m-stat-val mono">{myRank.arenaBest}점</span>
                  </div>
                  <div className="m-stat-item">
                    <span className="m-stat-label">🏆 종합 점수</span>
                    <span className="m-stat-val grand-val mono">{myRank.grandTotal} PTS</span>
                  </div>
                </div>
              </div>
            )}

            {/* 뱃지 컬렉션 (명예의 전당) */}
            <div className="badges-section card">
              <div className="section-title-wrap">
                <h3>🏅 명예의 뱃지 컬렉션</h3>
                <span className="badges-count mono">
                  획득한 뱃지:{" "}
                  <b>
                    {
                      BADGES_DEFINITIONS.filter((b) => b.checkUnlocked(myRank)).length
                    }
                  </b>{" "}
                  / {BADGES_DEFINITIONS.length}
                </span>
              </div>

              <div className="badges-grid">
                {BADGES_DEFINITIONS.map((badge) => {
                  const isUnlocked = badge.checkUnlocked(myRank);
                  return (
                    <div
                      key={badge.id}
                      className={`badge-card ${isUnlocked ? "unlocked" : "locked"}`}
                    >
                      <div className="badge-icon-wrap">
                        <span className="badge-name">{badge.name}</span>
                        {isUnlocked ? (
                          <span className="unlocked-tag mono">✅ 획득함</span>
                        ) : (
                          <span className="locked-tag mono">🔒 잠김</span>
                        )}
                      </div>
                      <p className="badge-desc">{badge.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 종합 순위표 TABLE */}
            <div className="leaderboard-table-card card">
              <div className="section-title-wrap" style={{ marginBottom: 16 }}>
                <h3>전체 학습자 종합 랭킹 (Top 20)</h3>
              </div>

              <table className="lb-table">
                <thead>
                  <tr>
                    <th>순위</th>
                    <th>학습자</th>
                    <th>완료 모듈</th>
                    <th>퀴즈 점수</th>
                    <th>아레나 최고점</th>
                    <th>종합 점수</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item) => {
                    const isMe = item.id === user?.id || item.id === myRank?.id;
                    const rankClass = getRankBadgeClass(item.rank);

                    return (
                      <tr key={item.id} className={`${isMe ? "is-me-row" : ""} ${rankClass}`}>
                        <td className="rank-cell">
                          <span className={`rank-pill mono ${rankClass}`}>
                            {getRankIcon(item.rank)}
                          </span>
                        </td>
                        <td className="user-name-cell">
                          <span className="user-name-text">{item.name}</span>
                          {isMe && <span className="me-tag mono">나</span>}
                        </td>
                        <td className="mono">{item.completedCount}개</td>
                        <td className="mono">{item.quizTotalScore}점</td>
                        <td className="mono">{item.arenaBest}점</td>
                        <td className="grand-score-cell mono">
                          <b>{item.grandTotal} PTS</b>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
