import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import ReactMarkdown from "react-markdown";
import "./PromptLab.css";

const PRESET_TEMPLATES = [
  {
    name: "🎭 페르소나 부여",
    systemPrompt: "당신은 10년 경력의 시니어 AI 연구원이자 훌륭한 멘토입니다. 어려운 인공지능 기술 개념도 초보자가 쉽게 이해하도록 비유와 예시를 들어 친절하게 설명합니다.",
    userPrompt: "Transformer 모델의 Self-Attention 메커니즘이 무엇인지 쉽게 설명해 주세요.",
    temperature: 0.7
  },
  {
    name: "🎯 Few-Shot 프롬프팅",
    systemPrompt: "주어진 예시의 형식과 분류 규칙을 정확히 따라서 입력 문장의 감정을 분석하세요.",
    userPrompt: `다음 입력 문장의 감정을 [긍정/부정/중립] 중 하나로 분류하고 이유를 한 줄로 설명하세요.

예시 1: "이번 업데이트 속도가 너무 빨라서 정말 대만족이에요!" -> 긍정 (만족감과 빠른 속도 칭찬)
예시 2: "서버가 또 다운되었네요... 매번 서비스가 이래서야..." -> 부정 (반복된 오류에 대한 불만)
예시 3: "다음 주 월요일 오전 10시에 정기 점검이 예정되어 있습니다." -> 중립 (단순 정보 전달)

입력: "처음에는 UI가 어색했는데 쓰다 보니 손에 익어서 훨씬 편하네요."`,
    temperature: 0.3
  },
  {
    name: "🧠 Chain-of-Thought",
    systemPrompt: "당신은 논리적 문제 해결 전문가입니다. 최종 결론을 내리기 전에 반드시 생각의 과정(Step-by-Step)을 단계별로 나열하고 검증하세요.",
    userPrompt: "AI 환각(Hallucination) 현상을 완전히 없애는 것이 현실적으로 불가능한 이유에 대해 단계별(1단계: 원인 분석, 2단계: 모델 한계, 3단계: 대응책 및 결론)로 논리적으로 추론해 주세요.",
    temperature: 0.5
  },
  {
    name: "💻 코드 리팩토링",
    systemPrompt: "당신은 최고 수준의 소프트웨어 아키텍트입니다. 코드의 성능, 가독성, 최적화 관점에서 리뷰하고 개선된 클린 코드를 제안합니다.",
    userPrompt: `다음 JavaScript 코드의 가독성과 성능을 개선하고 async/await 패턴으로 리팩토링해 주세요:

function fetchUserData(userId) {
  return fetch('/api/user/' + userId)
    .then(res => res.json())
    .then(user => {
      return fetch('/api/posts/' + user.id)
        .then(res => res.json())
        .then(posts => {
          return { user: user, posts: posts };
        });
    });
}`,
    temperature: 0.2
  },
  {
    name: "📄 핵심 요약 & 추출",
    systemPrompt: "긴 문맥 속에서 핵심 요약 3줄과 실행 가능한 인사이트(Action Item) 3가지를 명확히 요약하는 AI 요약전문가입니다.",
    userPrompt: "생성형 AI를 서비스에 도입할 때 고려해야 하는 비용, 환각 제어, 개인정보 보호 대책에 대해 3줄 요약과 핵심 인사이트 3가지를 정리해 주세요.",
    temperature: 0.4
  },
  {
    name: "🤖 모의 면접관",
    systemPrompt: "당신은 빅테크 기업의 AI 엔지니어링 직군 수석 면접관입니다. 지원자에게 프롬프트 엔지니어링 및 LLM 활용 역량을 평가하는 압박 면접 질문 1개를 던지고 답변을 기다리세요.",
    userPrompt: "안녕하세요, AI Quest 지원자입니다. 면접 질문을 해주세요.",
    temperature: 0.8
  }
];

export default function PromptLab() {
  const { token } = useAuth();
  const [systemPrompt, setSystemPrompt] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);

  const [output, setOutput] = useState("");
  const [durationMs, setDurationMs] = useState(null);
  const [tokenEstimate, setTokenEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [savedTemplates, setSavedTemplates] = useState([]);
  const [saveTitle, setSaveTitle] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    loadSavedTemplates();
  }, [token]);

  const loadSavedTemplates = async () => {
    try {
      const data = await api.getLabTemplates(token);
      setSavedTemplates(data.templates || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyPreset = (preset) => {
    setSystemPrompt(preset.systemPrompt);
    setUserPrompt(preset.userPrompt);
    setTemperature(preset.temperature);
    setOutput("");
    setError("");
  };

  const handleRun = async () => {
    if (!userPrompt.trim()) {
      setError("사용자 입력 프롬프트를 작성해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setOutput("");
    setDurationMs(null);
    setTokenEstimate(null);

    try {
      const res = await api.labRun(token, {
        systemPrompt,
        userPrompt,
        temperature
      });
      setOutput(res.output);
      setDurationMs(res.durationMs);
      setTokenEstimate(res.tokenEstimate);
    } catch (err) {
      setError(err.message || "응답 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!saveTitle.trim()) return;
    try {
      await api.saveLabTemplate(token, {
        title: saveTitle,
        systemPrompt,
        userPrompt,
        temperature
      });
      setSaveTitle("");
      setShowSaveModal(false);
      loadSavedTemplates();
    } catch (err) {
      alert("템플릿 저장 실패: " + err.message);
    }
  };

  const handleDeleteTemplate = async (id, e) => {
    e.stopPropagation();
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
    try {
      await api.deleteLabTemplate(token, id);
      loadSavedTemplates();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  const handleCopyOutput = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTempLabel = (temp) => {
    if (temp <= 0.3) return "🎯 정밀 및 분석적 (Low)";
    if (temp <= 0.7) return "⚖️ 균형 및 논리적 (Standard)";
    return "🎨 창의 및 자유로운 표현 (High)";
  };

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <header className="lab-header">
          <div>
            <p className="eyebrow">SANDBOX · PROMPT LAB</p>
            <h1 className="lab-title">⚡ AI 프롬프트 실습실</h1>
            <p className="lab-sub">
              페르소나, Few-Shot, Chain-of-Thought 기법을 적용하고 온도(Temperature)별 Groq AI의 응답 속도와 성능을 실시간으로 테스트해보세요.
            </p>
          </div>
        </header>

        {/* 템플릿 프리셋 선택 바 */}
        <section className="lab-presets-section card">
          <span className="mono presets-label">⚡ 기법별 템플릿 프리셋:</span>
          <div className="presets-chips">
            {PRESET_TEMPLATES.map((p, idx) => (
              <button
                key={idx}
                className="preset-chip"
                onClick={() => handleApplyPreset(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        <div className="lab-grid">
          {/* 왼쪽: 프롬프트 에디터 및 컨트롤 */}
          <div className="lab-editor card">
            <div className="editor-group">
              <label className="editor-label">
                <span>🎭 시스템 지시사항 (System Prompt / Persona)</span>
                <span className="editor-hint">AI의 역할, 지켜야 할 규칙, 출력 포맷 지정</span>
              </label>
              <textarea
                className="editor-textarea mono"
                placeholder="예: 당신은 친절한 AI 전문가입니다. 한국어로 설명해 주세요."
                rows={3}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
            </div>

            <div className="editor-group">
              <label className="editor-label">
                <span>💬 사용자 입력 (User Prompt)</span>
                <span className="editor-hint">실제 질문이나 실험할 문장 작성</span>
              </label>
              <textarea
                className="editor-textarea mono"
                placeholder="실험할 프롬프트나 질문을 입력하세요..."
                rows={6}
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />
            </div>

            {/* 온도(Temperature) 조절 슬라이더 */}
            <div className="editor-group temp-control">
              <div className="temp-header">
                <label className="editor-label">
                  <span>🌡️ 온도 설정 (Temperature)</span>
                  <span className="mono temp-val">{temperature.toFixed(1)}</span>
                </label>
                <span className="temp-status-tag mono">{getTempLabel(temperature)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="temp-range"
              />
              <div className="temp-ticks mono">
                <span>0.0 (정밀)</span>
                <span>0.5 (표준)</span>
                <span>1.0 (창의)</span>
              </div>
            </div>

            {error && <p className="error-text">{error}</p>}

            <div className="editor-actions">
              <button
                className="btn btn-primary lab-run-btn"
                onClick={handleRun}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span> AI 응답 생성 중...
                  </>
                ) : (
                  <>⚡ 프롬프트 실행</>
                )}
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowSaveModal(true)}
                disabled={!userPrompt.trim()}
              >
                💾 템플릿 저장
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSystemPrompt("");
                  setUserPrompt("");
                  setOutput("");
                  setError("");
                }}
              >
                🧹 초기화
              </button>
            </div>
          </div>

          {/* 오른쪽: AI 결과 출력 창 및 템플릿 목록 */}
          <div className="lab-output-col">
            <div className="lab-output card">
              <div className="output-header">
                <span className="output-title">🤖 Groq AI 응답 결과</span>
                <div className="output-metrics">
                  {durationMs !== null && (
                    <span className="metric-chip duration mono">
                      ⚡ {(durationMs / 1000).toFixed(2)}초 ({durationMs}ms)
                    </span>
                  )}
                  {tokenEstimate !== null && (
                    <span className="metric-chip token mono">
                      📊 약 {tokenEstimate} 토큰
                    </span>
                  )}
                  {output && (
                    <button className="btn btn-ghost btn-sm" onClick={handleCopyOutput}>
                      {copied ? "✅ 복사됨" : "📋 복사"}
                    </button>
                  )}
                </div>
              </div>

              <div className="output-content">
                {loading ? (
                  <div className="loading-state">
                    <div className="pulse-circle"></div>
                    <p className="mono">Groq Llama-3.3 AI 모델이 프롬프트를 연산 중입니다...</p>
                  </div>
                ) : output ? (
                  <div className="markdown-body">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="empty-output">
                    <p className="mono">좌측 에디터에 프롬프트를 입력하고 [⚡ 프롬프트 실행] 버튼을 눌러보세요.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 저장된 내 템플릿 세션 */}
            <div className="lab-saved card">
              <div className="saved-header">
                <h3>📁 내가 저장한 프롬프트 템플릿 ({savedTemplates.length})</h3>
              </div>
              {savedTemplates.length === 0 ? (
                <p className="empty-saved mono">저장된 사용자 템플릿이 없습니다.</p>
              ) : (
                <div className="saved-list">
                  {savedTemplates.map((t) => (
                    <div
                      key={t.id}
                      className="saved-item"
                      onClick={() => {
                        setSystemPrompt(t.system_prompt || "");
                        setUserPrompt(t.user_prompt || "");
                        setTemperature(t.temperature || 0.7);
                      }}
                    >
                      <div className="saved-item-info">
                        <span className="saved-item-title">{t.title}</span>
                        <span className="saved-item-meta mono">
                          Temp: {t.temperature} · {new Date(t.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="saved-item-actions">
                        <button className="btn btn-ghost btn-sm">불러오기</button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => handleDeleteTemplate(t.id, e)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 템플릿 저장 모달 */}
        {showSaveModal && (
          <div className="modal-backdrop" onClick={() => setShowSaveModal(false)}>
            <div className="modal-card card" onClick={(e) => e.stopPropagation()}>
              <h3>💾 프롬프트 템플릿 저장</h3>
              <p className="modal-desc">
                현재 작성한 시스템/사용자 프롬프트와 온도 설정을 템플릿으로 보관합니다.
              </p>
              <input
                type="text"
                className="modal-input"
                placeholder="템플릿 제목을 입력하세요 (예: Few-Shot 뉴스 요약)"
                value={saveTitle}
                onChange={(e) => setSaveTitle(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  onClick={handleSaveTemplate}
                  disabled={!saveTitle.trim()}
                >
                  저장하기
                </button>
                <button className="btn btn-ghost" onClick={() => setShowSaveModal(false)}>
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
