// 한국어 텍스트에 한자(중국어/한문 문자)가 섞여 나오는 것을 감지 및 정제하기 위한 정규식.
// CJK 통합 한자(U+4E00~U+9FFF), 확장A(U+3400~U+4DBF), 호환한자(U+F900~U+FAFF), 강희자전 부수(U+2F00~U+2FDF) 포함
export const HAN_REGEX = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\u2E80-\u2EFF\u2F00-\u2FDF]/;

export function containsForbiddenChars(value) {
  if (typeof value !== "string") return false;
  return HAN_REGEX.test(value);
}

/**
 * 텍스트에서 한자(중국어 문자)를 강제로 완벽 제거하는 헬퍼 함수
 */
export function removeHanja(text) {
  if (typeof text !== "string") return text;
  return text.replace(new RegExp(HAN_REGEX.source, "g"), "").trim();
}

/**
 * 객체 또는 배열 내부의 모든 문자열 속성에서 한자를 자동 재귀 정제하는 헬퍼
 */
export function sanitizeObjectHanja(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return removeHanja(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObjectHanja);
  if (typeof obj === "object") {
    const cleaned = {};
    for (const key of Object.keys(obj)) {
      cleaned[key] = sanitizeObjectHanja(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

export function findForbiddenInPages(pages) {
  for (const p of pages) {
    if (
      containsForbiddenChars(p.title) ||
      containsForbiddenChars(p.summary) ||
      containsForbiddenChars(p.body)
    ) {
      return true;
    }
    for (const v of p.visualItems || []) {
      if (containsForbiddenChars(v.label) || containsForbiddenChars(v.description)) {
        return true;
      }
    }
  }
  return false;
}

export function findForbiddenInQuestions(questions) {
  for (const q of questions) {
    if (containsForbiddenChars(q.question) || containsForbiddenChars(q.explanation)) {
      return true;
    }
    for (const opt of q.options || []) {
      if (containsForbiddenChars(opt)) return true;
    }
  }
  return false;
}
