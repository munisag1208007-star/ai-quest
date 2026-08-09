import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "..", "data.sqlite"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT,
    provider TEXT NOT NULL DEFAULT 'local',
    provider_id TEXT,
    tutorial_completed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started',
    best_score INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, topic_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- 서버가 생성한 퀴즈의 정답/해설을 보관한다. 클라이언트에는 절대 정답을 내려주지 않고,
  -- 문제를 풀 때마다 이 테이블과 대조해서 채점한다.
  CREATE TABLE IF NOT EXISTS quiz_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    topic_id TEXT NOT NULL,
    questions_json TEXT NOT NULL,   -- [{question, options, correctIndex, explanation}]
    answers_json TEXT NOT NULL DEFAULT '{}', -- { "0": { selected, correct }, ... }
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, topic_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Groq로 생성한 학습 콘텐츠를 주제 단위로 캐싱해서 API 호출/비용을 아낀다.
  -- 콘텐츠는 사용자에 따라 달라지지 않으므로 topic_id만으로 캐싱한다.
  CREATE TABLE IF NOT EXISTS content_cache (
    topic_id TEXT PRIMARY KEY,
    markdown TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------- 마이그레이션: 이메일 인증 관련 컬럼 추가 ----------
// 이미 존재하는 DB(data.sqlite)에는 CREATE TABLE IF NOT EXISTS가 적용되지 않으므로,
// 컬럼이 없을 때만 ALTER TABLE로 추가해준다. (기존 유저 데이터를 보존하기 위함)
const existingColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);

if (!existingColumns.includes("email_verified")) {
  // 소셜 로그인(kakao/naver/google)으로 이미 가입된 기존 유저는 이메일 인증 절차가 없었으므로
  // 마이그레이션 시점에 이미 인증된 것으로 간주해 로그인이 막히지 않게 한다.
  db.exec(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
  db.exec(`UPDATE users SET email_verified = 1 WHERE provider != 'local'`);
  db.exec(`UPDATE users SET email_verified = 1 WHERE provider = 'local'`); // 기존 로컬 유저도 소급 인증 처리
}
if (!existingColumns.includes("verification_code")) {
  db.exec(`ALTER TABLE users ADD COLUMN verification_code TEXT`);
}
if (!existingColumns.includes("verification_expires")) {
  db.exec(`ALTER TABLE users ADD COLUMN verification_expires TEXT`);
}

export default db;
