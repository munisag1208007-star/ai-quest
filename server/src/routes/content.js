import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askGemini } from "../utils/groq.js";
import { getOrCreateContent } from "../utils/contentGenerator.js";
import { TOPICS } from "../data/topics.js";
import db from "../db.js";

const router = Router();

router.get("/:topicId", requireAuth, async (req, res) => {
  const topic = TOPICS.find((t) => t.id === req.params.topicId);
  if (!topic) return res.status(404).json({ error: "존재하지 않는 주제예요." });

  try {
    const pages = await getOrCreateContent(topic);

    // 학습 시작으로 진행 상태 갱신 (완료 상태는 덮어쓰지 않음)
    db.prepare(
      `INSERT INTO progress (user_id, topic_id, status)
       VALUES (?, ?, 'learning')
       ON CONFLICT(user_id, topic_id)
       DO UPDATE SET status = CASE WHEN status = 'not_started' THEN 'learning' ELSE status END,
                      updated_at = datetime('now')`
    ).run(req.userId, topic.id);

    res.json({ topic, pages });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "콘텐츠 생성에 실패했어요." });
  }
});

// ---------- 학습 중 AI에게 질문하기 ----------
router.post("/:topicId/ask", requireAuth, async (req, res) => {
  const topic = TOPICS.find((t) => t.id === req.params.topicId);
  if (!topic) return res.status(404).json({ error: "존재하지 않는 주제예요." });

  const { question } = req.body;
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "질문을 입력해주세요." });
  }
  if (question.length > 500) {
    return res.status(400).json({ error: "질문은 500자 이내로 입력해주세요." });
  }

  try {
    const pages = await getOrCreateContent(topic);
    const contentSummary = pages
      .map((p, i) => `[${i + 1}페이지: ${p.title}]\n${p.body}`)
      .join("\n\n");

    const prompt = `당신은 고등학생에게 "${topic.name}"(${topic.maker})를 가르치는 친절한 AI 튜터입니다.
아래는 학생이 방금 읽은 학습 자료입니다.

${contentSummary}

학생의 질문: "${question.trim()}"

규칙:
- 반드시 자연스러운 한국어로만 답변하세요.
- 학습 자료의 맥락을 벗어나지 않는 선에서, 이해를 돕는 추가 설명을 해주세요.
- 3~5문장 이내로 간결하게 답변하세요.
- 너무 어려운 전문 용어는 풀어서 설명하세요.`;

    const answer = await askGemini(prompt);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "답변 생성에 실패했어요." });
  }
});

export default router;
