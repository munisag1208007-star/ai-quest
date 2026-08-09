// 한국어 텍스트에 한자(중국어 문자)가 섞여 나오는 걸 감지하기 위한 정규식.
// 한글(가-힣)은 정상, 한자(一-鿿)는 비정상으로 간주한다.
const HAN_REGEX = /[\u4e00-\u9fff]/;

export function containsForbiddenChars(value) {
  if (typeof value !== "string") return false;
  return HAN_REGEX.test(value);
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
