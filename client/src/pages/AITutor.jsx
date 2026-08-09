import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import Navbar from "../components/Navbar.jsx";
import ReactMarkdown from "react-markdown";
import "./AITutor.css";

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content: "안녕하세요! 🤖 **1:1 AI 튜터**입니다.\nAI 기술, 최신 프롬프트 엔지니어링, 개념 정리, 코드 문제 등 궁금한 것이 있다면 무엇이든 편하게 물어보세요!",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
];

const SUGGESTED_QUESTIONS = [
  "💡 Transformer 모델의 핵심 원리와 Self-Attention이 뭐야?",
  "⚡ Groq LPU와 기존 NVIDIA GPU의 속도 차이점은?",
  "🧠 Chain-of-Thought 기법으로 프롬프트 잘 쓰는 법",
  "🛡️ LLM 환각(Hallucination) 현상 방지 전략 3가지",
  "💻 RAG(검색 증강 생성) 기법 개념 쉽게 설명해줘"
];

export default function AITutor() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("ai_quest_tutor_chat");
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("ai_quest_tutor_chat", JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg = {
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInput("");
    setLoading(true);
    setError("");

    try {
      // 전달용 history 추출 (최근 6개)
      const historyContext = newHistory
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-6);

      const res = await api.sendTutorChat(token, {
        message: query,
        history: historyContext
      });

      const aiMsg = {
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err.message || "AI 튜터 응답을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    if (!confirm("대화 기록을 모두 초기화하시겠습니까?")) return;
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem("ai_quest_tutor_chat");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <Navbar />
      <div className="page fade-in">
        <header className="tutor-header">
          <div>
            <p className="eyebrow">STUDY ASSISTANT · 24/7 AI TUTOR</p>
            <h1 className="tutor-title">🤖 1:1 AI 튜터 챗</h1>
            <p className="tutor-sub">
              인공지능 용어, 최신 모델 트렌드, 코드 작성, 프롬프트 팁 등 모르는 부분에 대해 24시간 언제든 질의응답하세요.
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleClearChat}>
            🧹 대화 초기화
          </button>
        </header>

        {/* 추천 질문 칩 */}
        <section className="suggested-chips-section card">
          <span className="mono suggested-label">💡 추천 탐구 질문:</span>
          <div className="suggested-chips">
            {SUGGESTED_QUESTIONS.map((sq, idx) => (
              <button
                key={idx}
                className="sq-chip"
                onClick={() => handleSend(sq)}
                disabled={loading}
              >
                {sq}
              </button>
            ))}
          </div>
        </section>

        {/* 대화 창 */}
        <div className="tutor-chat-card card">
          <div className="chat-messages-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-row ${msg.role}`}>
                <div className="chat-avatar">
                  {msg.role === "assistant" ? "🤖" : "👤"}
                </div>
                <div className="chat-bubble-content">
                  <div className="chat-meta mono">
                    <span className="chat-sender-name">
                      {msg.role === "assistant" ? "AI 튜터" : user?.name || "학생"}
                    </span>
                    <span className="chat-time">{msg.timestamp}</span>
                  </div>
                  <div className="chat-text markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-bubble-row assistant loading-row">
                <div className="chat-avatar">🤖</div>
                <div className="chat-bubble-content">
                  <div className="chat-meta mono">
                    <span className="chat-sender-name">AI 튜터</span>
                    <span className="chat-time">입력 중...</span>
                  </div>
                  <div className="tutor-typing-indicator">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="error-text chat-error">{error}</p>}
            <div ref={chatEndRef} />
          </div>

          {/* 하단 입력 폼 */}
          <div className="chat-input-area">
            <textarea
              className="chat-textarea mono"
              placeholder="AI 관련 궁금한 내용을 질문하세요... (Enter: 전송, Shift+Enter: 줄바꿈)"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary send-btn"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              전송 🚀
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
