import "dotenv/config";

// Groq는 OpenAI와 호환되는 API 형식을 사용한다 (무료, 카드 등록 불필요).
const MODEL = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Groq API에 프롬프트를 보내고 텍스트(또는 JSON) 응답을 받아온다.
 * askGemini와 동일한 시그니처를 유지해서 content.js / quiz.js는 import만 바꾸면 되도록 했다.
 *
 * @param {string} prompt
 * @param {{ json?: boolean, schema?: object }} options
 *   - json: true면 JSON 형식으로만 응답하도록 강제
 *   - schema: Groq는 OpenAI처럼 엄격한 JSON 스키마 강제(strict mode)를 지원하지 않으므로,
 *             스키마가 있으면 프롬프트에 스키마 설명을 덧붙여서 모델이 형식을 따르도록 유도한다.
 */
export async function askGemini(prompt, { json = false, schema = null } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your-groq-api-key") {
    throw new Error(
      "GROQ_API_KEY가 설정되지 않았습니다. server/.env 파일에 키를 넣어주세요."
    );
  }

  let finalPrompt = prompt;
  if (json && schema) {
    finalPrompt += `\n\n반드시 아래 JSON 스키마를 정확히 따르는 JSON 객체 하나로만 응답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.\n\n스키마:\n${JSON.stringify(schema)}`;
  }

  const body = {
    model: MODEL,
    messages: [{ role: "user", content: finalPrompt }],
    temperature: 0.7,
    max_tokens: 2048
  };

  if (json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API 오류 (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq API가 빈 응답을 반환했습니다.");

  return json ? JSON.parse(text) : text;
}
