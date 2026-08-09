import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askGemini } from "../utils/groq.js";
import { TOPICS } from "../data/topics.js";
import db from "../db.js";

const router = Router();

router.get("/:topicId", requireAuth, async (req, res) => {
  const topic = TOPICS.find((t) => t.id === req.params.topicId);
  if (!topic) return res.status(404).json({ error: "존재하지 않는 주제예요." });

  try {
    // 콘텐츠는 사용자마다 달라지지 않으므로 주제 단위로 캐싱해서 재사용한다.
    const cached = db.prepare("SELECT markdown FROM content_cache WHERE topic_id = ?").get(topic.id);

    let markdown;
    if (cached) {
      markdown = cached.markdown;
    } else {
      const prompt = `당신은 고등학생을 대상으로 AI를 쉽고 재미있게 설명하는 교육 콘텐츠 작가입니다.
주제: "${topic.name}" (${topic.maker})
아래 마크다운 형식으로 한국어 설명 콘텐츠를 작성해주세요:

## 한눈에 보기
(2~3문장 요약)

## 핵심 개념
(3~4개의 핵심 포인트를 - 목록으로, 각 포인트는 1~2문장)

## 실제로 어떻게 쓰일까?
(구체적인 활용 예시 2~3가지)

## 알아두면 좋은 점
(주의할 점이나 흥미로운 사실 1~2가지)

전체 분량은 400~600자 내외로, 전문 용어는 풀어서 설명해주세요.`;

      markdown = await askGemini(prompt);

      db.prepare(
        `INSERT INTO content_cache (topic_id, markdown) VALUES (?, ?)
         ON CONFLICT(topic_id) DO UPDATE SET markdown = excluded.markdown, created_at = datetime('now')`
      ).run(topic.id, markdown);
    }

    // 학습 시작으로 진행 상태 갱신 (완료 상태는 덮어쓰지 않음)
    db.prepare(
      `INSERT INTO progress (user_id, topic_id, status)
       VALUES (?, ?, 'learning')
       ON CONFLICT(user_id, topic_id)
       DO UPDATE SET status = CASE WHEN status = 'not_started' THEN 'learning' ELSE status END,
                      updated_at = datetime('now')`
    ).run(req.userId, topic.id);

    res.json({ topic, content: markdown });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "콘텐츠 생성에 실패했어요." });
  }
});

export default router;
