import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askGemini } from "../utils/groq.js";
import { TOPICS } from "../data/topics.js";
import db from "../db.js";

const router = Router();

const arenaSchema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctIndex: { type: "integer" },
          explanation: { type: "string" },
          topicName: { type: "string" }
        },
        required: ["question", "options", "correctIndex", "explanation", "topicName"],
        additionalProperties: false
      }
    }
  },
  required: ["questions"],
  additionalProperties: false
};

// 퀴즈 아레나 무작위 5개 문제 생성
router.get("/questions", requireAuth, async (req, res) => {
  try {
    const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    const prompt = `AI 관련 주제중 하나인 "${randomTopic.name}"에 관한 스피드 퀴즈 5문제를 출제해주세요.
반드시 지켜야 할 규칙:
- 한국어로 작성하고, 한자나 불필요한 영어 파편을 절대 사용하지 마세요.
- 객관식 4선 선지 중 정답은 1개만 설정하세요.
- 질문(question), 선택지 배열(options), 정답인덱스 0~3(correctIndex), 해설(explanation), 주제명(topicName: "${randomTopic.name}")을 포함해야 합니다.
- 순수 JSON으로만 응답하세요.`;

    let data;
    let lastErr;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await askGemini(prompt, { json: true, schema: arenaSchema });
        if (result && Array.isArray(result.questions) && result.questions.length > 0) {
          data = result;
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!data || !data.questions || data.questions.length === 0) {
      throw lastErr || new Error("아레나 문제 생성 실패");
    }

    // 서버용 아레나 세션 저장
    const sessionId = "arena_" + Date.now();
    await db.run(
      `INSERT INTO quiz_sessions (user_id, topic_id, questions_json, answers_json)
       VALUES (?, ?, ?, '{}')
       ON CONFLICT(user_id, topic_id)
       DO UPDATE SET questions_json = excluded.questions_json, answers_json = '{}'`,
      [req.userId, sessionId, JSON.stringify(data.questions)]
    );

    // 클라이언트 전달용 (정답/해설 제외)
    const sanitized = data.questions.map((q, idx) => ({
      index: idx,
      question: q.question,
      options: q.options,
      topicName: q.topicName
    }));

    res.json({ sessionId, questions: sanitized });
  } catch (err) {
    console.error("Arena Questions Error:", err);
    res.status(502).json({ error: "아레나 문제 생성 중 오류가 발생했어요." });
  }
});

// 퀴즈 아레나 제출 및 채점 (타임어택 점수 산출)
router.post("/submit", requireAuth, async (req, res) => {
  const { sessionId, answers, timeSpentSec } = req.body;
  if (!sessionId || !answers) {
    return res.status(400).json({ error: "제출 정보가 올바르지 않아요." });
  }

  try {
    const session = await db.get(
      "SELECT * FROM quiz_sessions WHERE user_id = ? AND topic_id = ?",
      [req.userId, sessionId]
    );

    if (!session) {
      return res.status(404).json({ error: "아레나 세션을 찾을 수 없어요." });
    }

    const questions = JSON.parse(session.questions_json);
    let correctCount = 0;

    questions.forEach((q, idx) => {
      const userSel = answers[idx];
      if (userSel === q.correctIndex) {
        correctCount++;
      } else if (userSel !== undefined) {
        // 틀린 문제 오답노트 저장
        db.run(
          `INSERT INTO wrong_answers (user_id, topic_id, question, options_json, correct_index, user_index, explanation, mastered)
           VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            req.userId,
            q.topicName || "아레나",
            q.question,
            JSON.stringify(q.options),
            q.correctIndex,
            userSel,
            q.explanation
          ]
        ).catch(() => {});
      }
    });

    // 아레나 점수 계산: (맞힌 문제 * 200점) + 시간보너스 (최대 100점 - 소요초*2)
    const baseScore = correctCount * 200;
    const timeBonus = Math.max(0, 100 - (timeSpentSec || 30) * 2);
    const totalScore = baseScore + timeBonus;

    await db.run(
      `INSERT INTO arena_records (user_id, score, correct_count, total_count, time_spent_sec)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, totalScore, correctCount, questions.length, timeSpentSec || 30]
    );

    // 세션 삭제
    await db.run("DELETE FROM quiz_sessions WHERE user_id = ? AND topic_id = ?", [
      req.userId,
      sessionId
    ]);

    res.json({
      score: totalScore,
      correctCount,
      totalCount: questions.length,
      timeSpentSec,
      questionsWithAnswers: questions
    });
  } catch (err) {
    console.error("Arena Submit Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
