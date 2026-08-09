import "./CircuitMap.css";

// 대시보드의 시그니처 요소: 주제들을 회로판의 노드처럼 배치하고,
// 완료된 주제는 불이 켜진 것처럼 강조 표시한다.
export default function CircuitMap({ topics }) {
  const width = 720;
  const height = 220;
  const n = topics.length;
  const positions = topics.map((_, i) => {
    const x = 40 + (i * (width - 80)) / Math.max(n - 1, 1);
    const y = height / 2 + (i % 2 === 0 ? -34 : 34);
    return { x, y };
  });

  return (
    <div className="circuit-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="circuit-svg" role="img" aria-label="주제별 학습 진행 회로도">
        {positions.slice(0, -1).map((p, i) => {
          const next = positions[i + 1];
          const active = topics[i].status === "completed" && topics[i + 1].status !== "not_started";
          return (
            <line
              key={i}
              x1={p.x} y1={p.y} x2={next.x} y2={next.y}
              className={`circuit-line ${active ? "active" : ""}`}
            />
          );
        })}
        {positions.map((p, i) => {
          const t = topics[i];
          return (
            <g key={t.id} transform={`translate(${p.x}, ${p.y})`} className={`circuit-node status-${t.status}`}>
              <circle r="16" className="circuit-node-ring" style={{ "--accent": t.color }} />
              <circle r="6" className="circuit-node-core" style={{ "--accent": t.color }} />
              <text y="34" textAnchor="middle" className="circuit-node-label mono">
                {t.name.length > 8 ? t.name.slice(0, 7) + "…" : t.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
