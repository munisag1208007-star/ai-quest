import { askGemini } from "./groq.js";
import db from "../db.js";

const pagesSchema = {
  type: "object",
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          body: { type: "string" },
          visualItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                emoji: { type: "string" },
                label: { type: "string" },
                description: { type: "string" }
              },
              required: ["emoji", "label", "description"],
              additionalProperties: false
            }
          }
        },
        required: ["title", "summary", "body", "visualItems"],
        additionalProperties: false
      }
    }
  },
  required: ["pages"],
  additionalProperties: false
};

function buildPrompt(topic) {
  return `당신은 고등학생에게 AI를 쉽고 재미있게 설명하는 교육 콘텐츠 작가입니다.
주제: "${topic.name}" (${topic.maker})

이 주제를 배우는 사람이 순서대로 넘겨볼 수 있는 학습 페이지를 최소 3개, 최대 5개 만들어주세요.
예시 구성 (참고용, 그대로 따르지 않아도 됩니다):
1페이지 - 한눈에 보기 (이게 무엇인지, 왜 중요한지)
2페이지 - 핵심 개념 (동작 원리나 구조)
3페이지 - 실제 활용 사례
4페이지(선택) - 알아두면 좋은 점, 한계나 주의사항

반드시 지켜야 할 규칙:
- 모든 텍스트는 100% 자연스러운 한국어로 작성하세요. 알파벳 조각이나 의미 없는 영문 파편이 섞이면 안 됩니다.
- 각 페이지의 body는 3~5문장, 전문 용어는 풀어서 설명하세요.
- 각 페이지마다 visualItems를 2~4개 만드세요. 각 항목은 그 페이지 내용을 상징하는 이모지 1개, 짧은 라벨(3~8자), 한 줄 설명으로 구성하세요. 실제로 의미가 통하는 이모지를 고르세요.
- 문장이 중간에 끊기지 않도록 완결된 문장으로 작성하세요.
- 반드시 JSON으로만 응답하세요. 마크다운 코드블록도 포함하지 마세요.`;
}

// topic의 학습 페이지들을 캐시에서 가져오거나, 없으면 새로 생성해서 캐시에 저장한다.
// 퀴즈 생성 시에도 이 함수를 그대로 재사용해서, 학습한 내용과 다른 문제가 나오지 않도록 한다.
export async function getOrCreateContent(topic) {
  const cached = db.prepare("SELECT markdown FROM content_cache WHERE topic_id = ?").get(topic.id);

  if (cached) {
    try {
      const parsed = JSON.parse(cached.markdown);
      if (Array.isArray(parsed.pages) && parsed.pages.length >= 3) {
        return parsed.pages;
      }
    } catch {
      // 예전 형식(순수 마크다운 텍스트)으로 캐시된 항목은 무시하고 새로 생성한다.
    }
  }

  const data = await askGemini(buildPrompt(topic), { json: true, schema: pagesSchema });
  if (!Array.isArray(data.pages) || data.pages.length < 3) {
    throw new Error("학습 콘텐츠 형식이 올바르지 않아요.");
  }

  db.prepare(
    `INSERT INTO content_cache (topic_id, markdown) VALUES (?, ?)
     ON CONFLICT(topic_id) DO UPDATE SET markdown = excluded.markdown, created_at = datetime('now')`
  ).run(topic.id, JSON.stringify({ pages: data.pages }));

  return data.pages;
}
