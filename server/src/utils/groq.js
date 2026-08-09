import "dotenv/config";
import { removeHanja, sanitizeObjectHanja } from "./textValidation.js";

const MODEL = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Groq API에 프롬프트를 보내고 텍스트(또는 JSON) 응답을 받아온다.
 */
export async function askGemini(prompt, { json = false, schema = null, temperature = 0.7 } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your-groq-api-key") {
    throw new Error(
      "GROQ_API_KEY가 설정되지 않았습니다. server/.env 파일에 키를 넣어주세요."
    );
  }

  // 한자 사용 금지 지시사항을 무조건 프롬프트에 추가하여 모델 차원에서 차단
  const strictLanguageRule = "\n\n[엄격한 언어 작성 규칙]: 절대로 한자(漢字, Chinese Characters)나 불필요한 중국어/외국어 문자를 포함하지 마세요. 모든 내용, 단어, 질문, 선택지 및 설명은 100% 순수한 한글과 자연스러운 한국어로만 출력해야 합니다.";

  let finalPrompt = prompt + strictLanguageRule;
  if (json && schema) {
    finalPrompt += `\n\n반드시 아래 JSON 스키마를 정확히 따르는 JSON 객체 하나로만 응답하세요. 다른 설명이나 마크다운 코드블록 없이 순수 JSON만 출력하세요.\n\n스키마:\n${JSON.stringify(schema)}`;
  }

  const body = {
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "당신은 한국어 전용 AI 학습 교육 어시스턴트입니다. 오직 한글(가-힣)과 표준 한국어로만 모든 응답을 작성하세요. 한자(漢字) 문자는 절대 출력에 포함하지 마세요."
      },
      { role: "user", content: finalPrompt }
    ],
    temperature: temperature !== undefined ? Number(temperature) : 0.7,
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
  let text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq API가 빈 응답을 반환했습니다.");

  // 안전장치: 혹시라도 텍스트에 한자가 남아있으면 강제 정제
  if (json) {
    const parsed = JSON.parse(text);
    return sanitizeObjectHanja(parsed);
  } else {
    return removeHanja(text);
  }
}
