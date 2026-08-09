// Resend의 REST API를 fetch로 직접 호출한다. (nodemailer/SMTP 대신 — 더 단순하고 안정적)
const RESEND_API_URL = "https://api.resend.com/emails";

export async function sendVerificationEmail(to, code) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@aiquest.shop";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY가 설정되지 않았습니다. server/.env 파일에 키를 넣어주세요.");
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #F5A623;">AI Quest 이메일 인증</h2>
      <p>아래 인증 코드를 회원가입 화면에 입력해주세요.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px; background: #f5f5f5; padding: 16px; text-align: center; border-radius: 8px;">
        ${code}
      </p>
      <p style="color: #888; font-size: 13px;">이 코드는 10분 후에 만료됩니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
    </div>
  `;

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: `AI Quest <${fromEmail}>`,
      to,
      subject: "[AI Quest] 이메일 인증 코드",
      html
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`이메일 발송 실패 (${res.status}): ${errText}`);
  }

  return res.json();
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getExpiryTimestamp(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}
