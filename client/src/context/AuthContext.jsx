import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("aiquest_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("aiquest_user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("aiquest_token", token);
    else localStorage.removeItem("aiquest_token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("aiquest_user", JSON.stringify(user));
    else localStorage.removeItem("aiquest_user");
  }, [user]);

  function loginSuccess({ token, user }) {
    setToken(token);
    setUser(user);
  }

  function markTutorialDone() {
    setUser((u) => (u ? { ...u, tutorialCompleted: true } : u));
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, loginSuccess, logout, markTutorialDone }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth는 AuthProvider 내부에서만 사용할 수 있어요.");
  return ctx;
}
