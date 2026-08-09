import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

// ---------- 쿼리 헬퍼 ----------
// better-sqlite3의 prepare().get()/.run()/.all() 스타일을 최대한 유지하되,
// libsql 클라이언트는 비동기이므로 각 함수는 Promise를 반환한다.
// 호출부(라우트 파일들)는 db.get(sql, args) / db.run(sql, args) / db.all(sql, args) 형태로
// await 해서 사용한다.
async function run(sql, args = []) {
  const result = await client.execute({ sql, args });
  return {
    lastInsertRowid:
      result.lastInsertRowid !== undefined && result.lastInsertRowid !== null
        ? Number(result.lastInsertRowid)
        : null,
    changes: result.rowsAffected
  };
}

async function get(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows[0];
}

async function all(sql, args = []) {
  const result = await client.execute({ sql, args });
  return result.rows;
}

// ---------- 스키마 초기화 ----------
// 이 모듈은 ESM(import/export)이라 top-level await가 지원된다.
// db.js를 import하는 순간 아래 초기화가 끝날 때까지 기다리므로,
// 서버 쪽 다른 코드를 손댈 필요 없이 항상 스키마가 준비된 상태로 db를 쓸 수 있다.
await client.executeMultiple(`
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
    questions_json TEXT NOT NULL,
    answers_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, topic_id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  -- Groq로 생성한 학습 콘텐츠를 주제 단위로 캐싱해서 API 호출/비용을 아낀다.
  CREATE TABLE IF NOT EXISTS content_cache (
    topic_id TEXT PRIMARY KEY,
    markdown TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// ---------- 마이그레이션: 이메일 인증 관련 컬럼 추가 ----------
const columnsResult = await client.execute("PRAGMA table_info(users)");
const existingColumns = columnsResult.rows.map((c) => c.name);

if (!existingColumns.includes("email_verified")) {
  await client.execute(`ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0`);
  await client.execute(`UPDATE users SET email_verified = 1 WHERE provider != 'local'`);
  await client.execute(`UPDATE users SET email_verified = 1 WHERE provider = 'local'`);
}
if (!existingColumns.includes("verification_code")) {
  await client.execute(`ALTER TABLE users ADD COLUMN verification_code TEXT`);
}
if (!existingColumns.includes("verification_expires")) {
  await client.execute(`ALTER TABLE users ADD COLUMN verification_expires TEXT`);
}

const db = { run, get, all };
export default db;
