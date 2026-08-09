const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "요청 처리 중 문제가 발생했어요.");
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  verifyEmail: (payload) => request("/api/auth/verify-email", { method: "POST", body: payload }),
  resendVerification: (payload) => request("/api/auth/resend-verification", { method: "POST", body: payload }),
  oauthUrl: (provider) => `${API_URL}/api/auth/${provider}`,

  getMe: (token) => request("/api/auth/me", { token }),
  getTopics: (token) => request("/api/topics", { token }),
  getContent: (token, topicId) => request(`/api/content/${topicId}`, { token }),
  askAboutTopic: (token, topicId, question) =>
    request(`/api/content/${topicId}/ask`, { method: "POST", body: { question }, token }),
  getQuiz: (token, topicId) => request(`/api/quiz/${topicId}`, { token }),
  checkQuizAnswer: (token, topicId, payload) =>
    request(`/api/quiz/${topicId}/check`, { method: "POST", body: payload, token }),
  submitQuiz: (token, topicId) =>
    request(`/api/quiz/${topicId}/submit`, { method: "POST", token }),

  getDashboard: (token) => request("/api/progress/dashboard", { token }),
  completeTutorial: (token) =>
    request("/api/progress/complete-tutorial", { method: "POST", token }),

  // ⚡ 프롬프트 실습실
  labRun: (token, payload) => request("/api/lab/run", { method: "POST", body: payload, token }),
  getLabTemplates: (token) => request("/api/lab/templates", { token }),
  saveLabTemplate: (token, payload) => request("/api/lab/templates", { method: "POST", body: payload, token }),
  deleteLabTemplate: (token, id) => request(`/api/lab/templates/${id}`, { method: "DELETE", token }),

  // ⚔️ 퀴즈 아레나
  getArenaQuestions: (token) => request("/api/arena/questions", { token }),
  submitArenaScore: (token, payload) => request("/api/arena/submit", { method: "POST", body: payload, token }),

  // 🏆 리더보드
  getLeaderboard: (token) => request("/api/leaderboard", { token }),

  // 🤖 AI 튜터 챗
  sendTutorChat: (token, payload) => request("/api/tutor/chat", { method: "POST", body: payload, token }),

  // 📝 오답 노트
  getWrongAnswers: (token) => request("/api/review", { token }),
  masterWrongAnswer: (token, id) => request(`/api/review/master/${id}`, { method: "POST", token }),
  deleteWrongAnswer: (token, id) => request(`/api/review/${id}`, { method: "DELETE", token })
};
