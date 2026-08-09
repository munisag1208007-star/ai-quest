import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askGemini } from "../utils/groq.js";

const router = Router();

// 1:1 AI 튜터 질문 대화
router.post("/chat", requireAuth, async (req, res) => {
  const { message, history } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "질문을 입력해 주세요." });
  }

  const historyContext = Array.isArray(history) && history.length > 0
    ? history.slice(-6).map((h) => `${h.role === "user" ? "학생" : "AI튜터"}: ${h.content}`).join("\n")
    : "";

  const systemPrompt = `너는 친절하고 명쾌한 AI Quest 전용 '1:1 개인 AI 튜터'이다.
학생이 AI, 프롬프트 엔지니어링, 인공지능 윤리, 최신 AI 모델(Claude, ChatGPT, Gemini, Grok) 관련 질문을 했을 때 이해하기 쉽고 명확하게 설명해줘.

규칙:
- 모든 텍스트는 100% 자연스러운 한국어로만 작성한다.
- 한자(중국어 문자)를 절대 사용하지 마라.
- 불필요한 영어 파편을 쓰지 마라.
- 적절한 이모지와 가독성 좋은 마크다운 문단을 활용하라.`;

  const fullPrompt = `${systemPrompt}

${historyContext ? "[이전 대화 기록]\n" + historyContext + "\n\n" : ""}[학생의 질문]: ${message.trim()}`;

  try {
    const reply = await askGemini(fullPrompt);
    res.json({ reply });
  } catch (err) {
    console.error("AI Tutor Error:", err);
    res.status(502).json({ error: "AI 튜터 응답 생성 중 오류가 발생했어요: " + err.message });
  }
});

export default router;
