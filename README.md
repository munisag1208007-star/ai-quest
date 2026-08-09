# AI Quest — AI를 탐구하는 학습 플랫폼

Claude, ChatGPT, Gemini, Grok 등 다양한 AI 주제를 골라 학습하고 퀴즈로 이해도를 확인하는
풀스택 웹앱입니다. 카카오/네이버/구글 소셜 로그인과 자체 회원가입, Gemini API 기반의
실시간 학습 콘텐츠·퀴즈 생성, 학습 진도 대시보드를 포함합니다.

## 폴더 구조

```
ai-quest/
├── server/     # Express 백엔드 (인증, DB, Gemini API 호출)
└── client/     # React 프론트엔드 (Vite)
```

## 1. 로컬에서 실행하기

### 1-1. 백엔드

```bash
cd server
npm install
cp .env.example .env   # 아래 "환경변수 설정"을 참고해 값 채우기
npm run dev
```
`http://localhost:4000` 에서 서버가 실행됩니다. 첫 실행 시 `data.sqlite` 파일이 자동 생성됩니다.

### 1-2. 프론트엔드

```bash
cd client
npm install
cp .env.example .env
npm run dev
```
`http://localhost:5173` 에서 앱이 열립니다.

> 처음에는 소셜 로그인 키가 없어도 **이메일 회원가입/로그인**은 바로 작동합니다.
> 학습·퀴즈 기능은 Gemini API 키가 있어야 동작합니다.

## 2. 환경변수 설정

### server/.env

| 변수 | 설명 |
|---|---|
| `PORT` | 서버 포트 (기본 4000) |
| `CLIENT_URL` | 프론트엔드 주소 (CORS 및 OAuth 리다이렉트에 사용) |
| `JWT_SECRET` | 로그인 세션 서명용 임의의 긴 문자열 |
| `GEMINI_API_KEY` | 아래 2-1 참고 |
| `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` / `KAKAO_REDIRECT_URI` | 아래 2-2 참고 |
| `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET` / `NAVER_REDIRECT_URI` | 아래 2-3 참고 |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_REDIRECT_URI` | 아래 2-4 참고 |

### client/.env

| 변수 | 설명 |
|---|---|
| `VITE_API_URL` | 백엔드 주소 (배포 후 실제 서버 주소로 변경) |

## 2. 각 서비스 키 발급 방법

### 2-1. Gemini API 키
1. https://aistudio.google.com/apikey 접속 후 구글 계정으로 로그인
2. "Create API key" 클릭 → 키 복사
3. `server/.env`의 `GEMINI_API_KEY`에 붙여넣기

무료 등급(Free tier)으로도 개인/학습 프로젝트에 충분합니다.

### 2-2. 카카오 로그인
1. https://developers.kakao.com → 내 애플리케이션 → 애플리케이션 추가
2. 앱 생성 후 **요약 정보**에서 "REST API 키" 복사 → `KAKAO_CLIENT_ID`
3. **카카오 로그인** 메뉴에서 활성화 ON
4. **Redirect URI**에 `http://localhost:4000/api/auth/kakao/callback` 등록
   (배포 후에는 실제 서버 주소로 추가 등록: `https://your-server.com/api/auth/kakao/callback`)
5. **보안** 탭에서 Client Secret 생성 → `KAKAO_CLIENT_SECRET`
6. **동의항목**에서 닉네임, 이메일 수집 항목을 "필수 동의"로 설정 (선택 시 이메일이 안 넘어올 수 있음)

### 2-3. 네이버 로그인
1. https://developers.naver.com/apps → 애플리케이션 등록
2. 사용 API에서 "네이버 로그인" 선택
3. 서비스 URL: `http://localhost:5173` (배포 후 실제 프론트 주소로 변경/추가)
4. Callback URL: `http://localhost:4000/api/auth/naver/callback`
5. 등록 완료 후 발급되는 Client ID / Client Secret을 각각
   `NAVER_CLIENT_ID` / `NAVER_CLIENT_SECRET`에 입력

### 2-4. 구글 로그인
1. https://console.cloud.google.com/apis/credentials 접속
2. 프로젝트 생성 (또는 기존 프로젝트 선택)
3. **OAuth 동의 화면** 설정 (User Type: 외부, 앱 이름/이메일 입력)
4. **사용자 인증 정보 만들기** → OAuth 클라이언트 ID → 애플리케이션 유형: 웹 애플리케이션
5. 승인된 리디렉션 URI에 `http://localhost:4000/api/auth/google/callback` 추가
6. 발급된 클라이언트 ID/Secret을 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`에 입력

## 3. 배포하기 (예: Render + Vercel 조합)

무료로 시작하기 좋은 조합 기준으로 안내합니다. 다른 서비스를 써도 원리는 같습니다.

### 3-1. 백엔드 배포 (Render)
1. https://render.com 가입 → New → Web Service
2. 이 프로젝트의 `server` 폴더를 대상으로 배포 (GitHub 연동 또는 직접 업로드)
3. Build Command: `npm install`, Start Command: `npm start`
4. Environment 탭에서 `.env`에 있던 값들을 그대로 등록
   (단, `CLIENT_URL`과 각 `*_REDIRECT_URI`는 실제 배포 주소로 변경)
5. 배포 완료 후 발급되는 주소(예: `https://ai-quest-server.onrender.com`)를 기억해두기

### 3-2. 프론트엔드 배포 (Vercel)
1. https://vercel.com 가입 → New Project → `client` 폴더 지정
2. Framework Preset: Vite
3. Environment Variables에 `VITE_API_URL=https://ai-quest-server.onrender.com` 등록
4. 배포 완료 후 발급되는 주소(예: `https://ai-quest.vercel.app`)를 기억해두기

### 3-3. 마무리 연결
1. Render의 `CLIENT_URL`을 Vercel 주소로 업데이트 후 재배포
2. 카카오/네이버/구글 개발자 센터에서 각각의 Redirect URI를
   `https://ai-quest-server.onrender.com/api/auth/{provider}/callback` 형태로 **추가 등록**
   (로컬 개발용 URI는 남겨두고 배포용을 추가하면 둘 다 사용 가능)
3. 네이버는 서비스 URL에도 Vercel 주소를 추가 등록

## 4. 주제 추가하기

`server/src/data/topics.js` 배열에 항목을 추가하면 홈 화면 카드가 자동으로 늘어납니다.
학습 설명과 퀴즈는 Gemini API가 주제 이름을 기반으로 그때그때 생성하므로, 이 파일만 수정하면
새 주제가 바로 학습 가능한 상태가 됩니다.

## 5. 기술 스택 요약

- **프론트엔드**: React 18, React Router, react-markdown, Vite
- **백엔드**: Express, better-sqlite3, jsonwebtoken, bcryptjs
- **인증**: 자체 이메일/비밀번호(JWT) + 카카오/네이버/구글 OAuth 2.0
- **AI 콘텐츠**: Gemini 2.0 Flash (`generateContent` API, 구조화된 JSON 응답 활용)
