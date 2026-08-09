import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import CircuitMap from "../components/CircuitMap.jsx";
import "./Dashboard.css";

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard(token).then(setData).catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <>
        <Navbar />
        <div className="page"><p className="error-text">{error}</p></div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="page"><p className="mono" style={{ color: "var(--muted)" }}>불러오는 중...</p></div>
      </>
    );
  }

  const progressPct = Math.round((data.completed / data.totalTopics) * 100);

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <p className="eyebrow">DASHBOARD</p>
        <h1 className="dash-title">나의 학습 현황</h1>

        <div className="dash-stats">
          <div className="card dash-stat">
            <span className="mono dash-stat-label">전체 진행률</span>
            <span className="dash-stat-value">{progressPct}%</span>
          </div>
          <div className="card dash-stat">
            <span className="mono dash-stat-label">완료한 주제</span>
            <span className="dash-stat-value">{data.completed} / {data.totalTopics}</span>
          </div>
          <div className="card dash-stat">
            <span className="mono dash-stat-label">학습 중</span>
            <span className="dash-stat-value">{data.inProgress}</span>
          </div>
          <div className="card dash-stat">
            <span className="mono dash-stat-label">평균 점수</span>
            <span className="dash-stat-value">{data.avgScore}%</span>
          </div>
        </div>

        <div className="card dash-map-card">
          <p className="eyebrow" style={{ marginBottom: 16 }}>진행 회로도</p>
          <CircuitMap topics={data.topics} />
        </div>

        <div className="card dash-table-card">
          <p className="eyebrow" style={{ marginBottom: 14 }}>주제별 상세</p>
          <table className="dash-table">
            <thead>
              <tr>
                <th>주제</th>
                <th>상태</th>
                <th>최고 점수</th>
                <th>시도 횟수</th>
              </tr>
            </thead>
            <tbody>
              {data.topics.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span className="dash-table-dot" style={{ background: t.color }} />
                    {t.name}
                  </td>
                  <td className={`dash-table-status status-${t.status}`}>
                    {t.status === "completed" ? "완료" : t.status === "learning" ? "학습 중" : "시작 전"}
                  </td>
                  <td className="mono">{t.bestScore}%</td>
                  <td className="mono">{t.attempts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
