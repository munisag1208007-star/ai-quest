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
    throw new Error(data.error || "요청 처리 중 문제가 발생했어요.");
  }
  return data;
}

export const api = {
  signup: (payload) => request("/api/auth/signup", { method: "POST", body: payload }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
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
    request("/api/progress/complete-tutorial", { method: "POST", token })
};
