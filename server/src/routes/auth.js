import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { signToken, requireAuth } from "../middleware/auth.js";
import { sendVerificationEmail, generateVerificationCode, getExpiryTimestamp } from "../utils/email.js";

const router = Router();

const PROVIDER_LABEL = { local: "이메일", kakao: "카카오", naver: "네이버", google: "구글" };

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider,
    tutorialCompleted: !!user.tutorial_completed
  };
}

// 쿠키 헤더를 직접 파싱한다 (cookie-parser 의존성 없이 최소 구현).
function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((pair) => {
      const idx = pair.indexOf("=");
      const key = decodeURIComponent(pair.slice(0, idx).trim());
      const value = decodeURIComponent(pair.slice(idx + 1).trim());
      return [key, value];
    })
  );
}

// ---------- 자체 회원가입 / 로그인 ----------

router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "이름, 이메일, 비밀번호를 모두 입력해주세요." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "비밀번호는 6자 이상이어야 해요." });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return res.status(409).json({ error: "이미 가입된 이메일이에요." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const code = generateVerificationCode();
  const expires = getExpiryTimestamp(10);

  const info = db
    .prepare(
      `INSERT INTO users (email, name, password_hash, provider, email_verified, verification_code, verification_expires)
       VALUES (?, ?, ?, 'local', 0, ?, ?)`
    )
    .run(email, name, passwordHash, code, expires);

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error(err);
    // 이메일 발송에 실패해도 계정은 이미 만들어졌으니, 재발송 라우트로 다시 시도할 수 있게 안내한다.
    return res.status(502).json({
      error: "인증 이메일 발송에 실패했어요. 잠시 후 인증 코드 재전송을 시도해주세요.",
      email
    });
  }

  res.status(201).json({ pendingVerification: true, email });
});

// ---------- 이메일 인증 코드 확인 ----------
router.post("/verify-email", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "이메일과 인증 코드를 입력해주세요." });
  }

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) {
    return res.status(404).json({ error: "가입 정보를 찾을 수 없어요." });
  }
  if (user.email_verified) {
    const token = signToken(user);
    return res.json({ token, user: publicUser(user), isFirstLogin: !user.tutorial_completed });
  }

  if (!user.verification_code || user.verification_code !== code) {
    return res.status(400).json({ error: "인증 코드가 올바르지 않아요." });
  }
  if (!user.verification_expires || new Date(user.verification_expires) < new Date()) {
    return res.status(400).json({ error: "인증 코드가 만료됐어요. 재전송을 요청해주세요." });
  }

  db.prepare(
    "UPDATE users SET email_verified = 1, verification_code = NULL, verification_expires = NULL WHERE id = ?"
  ).run(user.id);

  const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id);
  const token = signToken(updatedUser);
  res.json({ token, user: publicUser(updatedUser), isFirstLogin: true });
});

// ---------- 인증 코드 재전송 ----------
router.post("/resend-verification", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "이메일을 입력해주세요." });

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user) return res.status(404).json({ error: "가입 정보를 찾을 수 없어요." });
  if (user.email_verified) return res.status(409).json({ error: "이미 인증된 이메일이에요." });

  const code = generateVerificationCode();
  const expires = getExpiryTimestamp(10);
  db.prepare("UPDATE users SET verification_code = ?, verification_expires = ? WHERE id = ?").run(
    code,
    expires,
    user.id
  );

  try {
    await sendVerificationEmail(email, code);
  } catch (err) {
    console.error(err);
    return res.status(502).json({ error: "이메일 발송에 실패했어요. 잠시 후 다시 시도해주세요." });
  }

  res.json({ sent: true });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

  // 소셜 로그인으로 가입한 이메일로 비밀번호 로그인을 시도한 경우, 원인을 명확히 알려준다.
  if (user && user.provider !== "local") {
    return res.status(401).json({
      error: `이 이메일은 ${PROVIDER_LABEL[user.provider] || user.provider} 로그인으로 가입되어 있어요. ${PROVIDER_LABEL[user.provider] || user.provider} 로그인을 이용해주세요.`
    });
  }

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 올바르지 않아요." });
  }

  if (!user.email_verified) {
    return res.status(403).json({
      error: "이메일 인증이 완료되지 않았어요. 인증 코드를 확인해주세요.",
      needsVerification: true,
      email: user.email
    });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user), isFirstLogin: !user.tutorial_completed });
});

// 소셜 로그인 직후 프론트가 실제 사용자 정보를 채우기 위해 호출
router.get("/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!user) return res.status(404).json({ error: "사용자를 찾을 수 없어요." });
  res.json({ user: publicUser(user) });
});

// ---------- 카카오 로그인 ----------
router.get("/kakao", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.KAKAO_CLIENT_ID,
    redirect_uri: process.env.KAKAO_REDIRECT_URI,
    response_type: "code"
  });
  res.redirect(`https://kauth.kakao.com/oauth/authorize?${params}`);
});

router.get("/kakao/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET,
        redirect_uri: process.env.KAKAO_REDIRECT_URI,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("카카오 토큰 발급 실패");

    const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();

    const providerId = String(profile.id);
    const email = profile.kakao_account?.email || `kakao_${providerId}@no-email.local`;
    const name = profile.kakao_account?.profile?.nickname || "카카오 사용자";

    finishOAuthLogin(res, { provider: "kakao", providerId, email, name });
  } catch (err) {
    console.error(err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=kakao`);
  }
});

// ---------- 네이버 로그인 ----------
router.get("/naver", (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("naver_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000
  });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.NAVER_CLIENT_ID,
    redirect_uri: process.env.NAVER_REDIRECT_URI,
    state
  });
  res.redirect(`https://nid.naver.com/oauth2.0/authorize?${params}`);
});

router.get("/naver/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    const cookies = parseCookies(req);
    const savedState = cookies.naver_oauth_state;
    res.clearCookie("naver_oauth_state");

    if (!state || !savedState || state !== savedState) {
      throw new Error("네이버 로그인 상태 값이 일치하지 않아요. (CSRF 방지)");
    }

    const tokenRes = await fetch(
      `https://nid.naver.com/oauth2.0/token?${new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NAVER_CLIENT_ID,
        client_secret: process.env.NAVER_CLIENT_SECRET,
        code,
        state
      })}`
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("네이버 토큰 발급 실패");

    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profileData = await profileRes.json();
    const profile = profileData.response;

    finishOAuthLogin(res, {
      provider: "naver",
      providerId: profile.id,
      email: profile.email || `naver_${profile.id}@no-email.local`,
      name: profile.name || profile.nickname || "네이버 사용자"
    });
  } catch (err) {
    console.error(err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=naver`);
  }
});

// ---------- 구글 로그인 ----------
router.get("/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account"
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        code
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("구글 토큰 발급 실패");

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();

    finishOAuthLogin(res, {
      provider: "google",
      providerId: profile.id,
      email: profile.email,
      name: profile.name || "구글 사용자"
    });
  } catch (err) {
    console.error(err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google`);
  }
});

// 소셜 로그인 공통 처리
function finishOAuthLogin(res, { provider, providerId, email, name }) {
  let user = db
    .prepare("SELECT * FROM users WHERE provider = ? AND provider_id = ?")
    .get(provider, providerId);

  let isFirstLogin = false;

  if (!user) {
    const emailOwner = email ? db.prepare("SELECT * FROM users WHERE email = ?").get(email) : null;

    if (emailOwner) {
      const redirectUrl = new URL("/login", process.env.CLIENT_URL);
      redirectUrl.searchParams.set("error", "email_taken");
      redirectUrl.searchParams.set("existingProvider", emailOwner.provider);
      return res.redirect(redirectUrl.toString());
    }

    // 소셜 로그인은 플랫폼에서 이미 이메일 소유를 확인해줬으므로 인증 절차 없이 바로 인증 완료 처리한다.
    const info = db
      .prepare(
        "INSERT INTO users (email, name, provider, provider_id, email_verified) VALUES (?, ?, ?, ?, 1)"
      )
      .run(email, name, provider, providerId);
    user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    isFirstLogin = true;
  } else {
    isFirstLogin = !user.tutorial_completed;
  }

  const token = signToken(user);
  const redirectUrl = new URL("/oauth/callback", process.env.CLIENT_URL);
  redirectUrl.searchParams.set("token", token);
  redirectUrl.searchParams.set("firstLogin", isFirstLogin ? "1" : "0");
  res.redirect(redirectUrl.toString());
}

export default router;