import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../api.js";
import "./Welcome.css";

const STEPS = [
  {
    tag: "STEP_01",
    title: "주제를 골라보세요",
    body: "Claude, ChatGPT, Gemini, Grok부터 AI 에이전트, 프롬프트 엔지니어링까지 — 원하는 순서로 자유롭게 탐색할 수 있어요."
  },
  {
    tag: "STEP_02",
    title: "핵심 개념을 읽어요",
    body: "각 주제마다 AI가 방금 만들어낸 맞춤 설명이 제공돼요. 한눈에 보기부터 실제 활용 사례까지 짧고 명확하게 정리돼요."
  },
  {
    tag: "STEP_03",
    title: "퀴즈로 확인해요",
    body: "학습한 내용을 5문제 퀴즈로 점검하고, 60% 이상 맞히면 주제가 완료 처리돼요. 몇 번이든 다시 도전할 수 있어요."
  },
  {
    tag: "STEP_04",
    title: "대시보드에서 진도를 봐요",
    body: "완료한 주제, 평균 점수, 전체 진행률을 회로도 형태의 맵으로 한눈에 확인할 수 있어요."
  }
];

export default function Welcome() {
  const { user, markTutorialDone, token } = useAuth();
  const [step, setStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const navigate = useNavigate();

  async function finish() {
    setFinishing(true);
    try {
      await api.completeTutorial(token);
    } catch {
      // 튜토리얼 완료 저장에 실패해도 사용자 흐름은 막지 않음
    }
    markTutorialDone();
    navigate("/");
  }

  const isLast = step === STEPS.length - 1;

  return (
    <div className="welcome-page">
      <div className="welcome-card card fade-in">
        <p className="eyebrow">WELCOME</p>
        <h1 className="welcome-title">환영합니다, {user?.name || "학습자"}님!</h1>
        <p className="welcome-sub">
          AI Quest는 여러 AI를 자유롭게 탐구하고 실력을 확인하는 학습 공간이에요.
          시작하기 전에 짧게 둘러볼까요?
        </p>

        <div className="welcome-step">
          <span className="mono welcome-step-tag">{STEPS[step].tag}</span>
          <h2 className="welcome-step-title">{STEPS[step].title}</h2>
          <p className="welcome-step-body">{STEPS[step].body}</p>
        </div>

        <div className="welcome-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`welcome-dot ${i === step ? "on" : ""}`} />
          ))}
        </div>

        <div className="welcome-actions">
          <button className="btn btn-ghost" onClick={finish} disabled={finishing}>
            건너뛰기
          </button>
          <button
            className="btn btn-primary"
            disabled={finishing}
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          >
            {finishing ? <span className="spinner" /> : isLast ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
