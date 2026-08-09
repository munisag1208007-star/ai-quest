import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askGemini } from "../utils/groq.js";
import { getOrCreateContent } from "../utils/contentGenerator.js";
import { findForbiddenInQuestions } from "../utils/textValidation.js";
import { TOPICS } from "../data/topics.js";
import db from "../db.js";

const router = Router();

const quizSchema = {
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
          explanation: { type: "string" }
        },
        required: ["question", "options", "correctIndex", "explanation"],
        additionalProperties: false
      }
    }
  },
  required: ["questions"],
  additionalProperties: false
};

// 클라이언트로 내려보낼 때는 정답(correctIndex)과 해설(explanation)을 절대 포함하지 않는다.
function sanitizeForClient(questions) {
  return questions.map((q, i) => ({
    index: i,
    question: q.question,
    options: q.options
  }));
}

// ---------- 퀴즈 생성 ----------
// 매번 새 퀴즈를 만들고, 정답이 포함된 원본은 서버(DB)에만 저장한다.
router.get("/:topicId", requireAuth, async (req, res) => {
  const topic = TOPICS.find((t) => t.id === req.params.topicId);
  if (!topic) return res.status(404).json({ error: "존재하지 않는 주제예요." });

  try {
    const pages = await getOrCreateContent(topic);
    const contentSummary = pages
      .map((p, i) => `[${i + 1}페이지: ${p.title}]\n${p.body}`)
      .join("\n\n");

    const prompt = `아래는 "${topic.name}" (${topic.maker})에 대한 학습 자료입니다.

${contentSummary}

이 학습 자료의 내용만을 바탕으로, 고등학생 수준의 객관식 퀴즈 5문제를 만들어주세요.

반드시 지켜야 할 규칙:
- 학습 자료에 나온 내용 범위를 절대 벗어나지 마세요. 자료에 없는 사실을 지어내면 안 됩니다.
- 모든 텍스트(question, options, explanation)는 100% 자연스러운 한국어로만 작성하세요.
- 한자(중국어 문자)를 절대 사용하지 마세요. 순수 한글로만 쓰세요.
- 알파벳 조각이나 의미 없는 영문 파편도 섞이면 안 됩니다.
- 각 문제는 4개의 선택지를 가지고, 정답은 하나만 있어야 합니다.
- 너무 지엽적인 지식보다는 개념 이해를 확인하는 문제로 구성해주세요.
- 문장이 중간에 끊기지 않도록 완결된 문장으로 작성하세요.
- 반드시 JSON으로만 응답하세요. 마크다운 코드블록도 포함하지 마세요.`;

    let data;
    let lastError;
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await askGemini(prompt, { json: true, schema: quizSchema });
        if (!Array.isArray(result.questions) || result.questions.length === 0) {
          lastError = new Error("퀴즈 형식이 올바르지 않아요.");
          continue;
        }
        if (findForbiddenInQuestions(result.questions)) {
          lastError = new Error("생성된 퀴즈에 이상 문자가 섞여 있어 다시 생성했어요.");
          continue;
        }
        data = result;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!data) {
      throw lastError || new Error("퀴즈 생성에 실패했어요.");
    }

    // 정답이 포함된 전체 데이터는 서버에만 저장 (재도전 시 이전 세션은 덮어씀).
    db.prepare(
      `INSERT INTO quiz_sessions (user_id, topic_id, questions_json, answers_json)
       VALUES (?, ?, ?, '{}')
       ON CONFLICT(user_id, topic_id)
       DO UPDATE SET questions_json = excluded.questions_json,
                      answers_json = '{}',
                      created_at = datetime('now')`
    ).run(req.userId, topic.id, JSON.stringify(data.questions));

    res.json({ topic, questions: sanitizeForClient(data.questions) });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message || "퀴즈 생성에 실패했어요." });
  }
});

// ---------- 한 문제 채점 ----------
// 사용자가 한 문제를 고르고 "정답 확인"을 누를 때마다 호출.
// 서버가 저장해둔 정답과 대조해서 결과와 해설만 내려준다.
router.post("/:topicId/check", requireAuth, (req, res) => {
  const topic = TOPICS.find((t) => t.id === req.params.topicId);
  if (!topic) return res.status(404).json({ error: "존재하지 않는 주제예요." });

  const { index, selected } = req.body;
  if (typeof index !== "number" || typeof selected !== "number") {
    return res.status(400).json({ error: "답안 데이터가 올바르지 않아요." });
  }

  const session = db
    .prepare("SELECT * FROM quiz_sessions WHERE user_id = ? AND topic_id = ?")
    .get(req.userId, topic.id);

  if (!session) {
    return res.status(409).json({ error: "퀴즈 세션을 찾을 수 없어요. 퀴즈를 다시 불러와주세요." });
  }

  const questions = JSON.parse(session.questions_json);
  const question = questions[index];
  if (!question) {
    return res.status(400).json({ error: "존재하지 않는 문제예요." });
  }

  const answers = JSON.parse(session.answers_json);
  // 이미 채점한 문제를 다시 보내면 처음 제출한 결과를 그대로 유지 (재요청으로 답 바꿔치기 방지).
  if (answers[index]) {
    const prev = answers[index];
    return res.json({
      correct: prev.correct,
      correctIndex: question.correctIndex,
      explanation: question.explanation
    });
  }

  const correct = selected === question.correctIndex;
  answers[index] = { selected, correct };

  db.prepare("UPDATE quiz_sessions SET answers_json = ? WHERE user_id = ? AND topic_id = ?").run(
    JSON.stringify(answers),
    req.userId,
    topic.id
  );

  res.json({ correct, correctIndex: question.correctIndex, explanation: question.explanation });
});

// ---------- 최종 제출 ----------
// 클라이언트가 점수를 계산해서 보내는 게 아니라, 서버가 저장해둔 채점 기록으로 직접 점수를 낸다.
router.post("/:topicId/submit", requireAuth, (req, res) => {
  const topic = TOPICS.find((t) => t.id === req.params.topicId);
  if (!topic) return res.status(404).json({ error: "존재하지 않는 주제예요." });

  const session = db
    .prepare("SELECT * FROM quiz_sessions WHERE user_id = ? AND topic_id = ?")
    .get(req.userId, topic.id);

  if (!session) {
    return res.status(409).json({ error: "퀴즈 세션을 찾을 수 없어요. 퀴즈를 다시 불러와주세요." });
  }

  const questions = JSON.parse(session.questions_json);
  const answers = JSON.parse(session.answers_json);
  const total = questions.length;
  const answeredCount = Object.keys(answers).length;

  if (answeredCount < total) {
    return res.status(400).json({ error: "아직 풀지 않은 문제가 있어요." });
  }

  const score = Object.values(answers).filter((a) => a.correct).length;
  const percent = Math.round((score / total) * 100);
  const passed = percent >= 60;

  const existing = db
    .prepare("SELECT * FROM progress WHERE user_id = ? AND topic_id = ?")
    .get(req.userId, topic.id);

  const bestScore = Math.max(existing?.best_score || 0, percent);
  const status = passed ? "completed" : "learning";

  db.prepare(
    `INSERT INTO progress (user_id, topic_id, status, best_score, attempts)
     VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(user_id, topic_id)
     DO UPDATE SET
       status = CASE WHEN excluded.status = 'completed' OR progress.status = 'completed' THEN 'completed' ELSE excluded.status END,
       best_score = MAX(progress.best_score, excluded.best_score),
       attempts = progress.attempts + 1,
       updated_at = datetime('now')`
  ).run(req.userId, topic.id, status, bestScore);

  // 세션 소모: 같은 결과로 다시 제출(재요청 반복)해서 attempts를 부풀리지 못하게 삭제.
  db.prepare("DELETE FROM quiz_sessions WHERE user_id = ? AND topic_id = ?").run(req.userId, topic.id);

  res.json({ score, total, percent, passed, bestScore: Math.max(bestScore, percent) });
});

export default router;