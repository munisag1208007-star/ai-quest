import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { TOPICS } from "../data/topics.js";
import db from "../db.js";

const router = Router();

router.get("/dashboard", requireAuth, (req, res) => {
  const rows = db
    .prepare("SELECT * FROM progress WHERE user_id = ?")
    .all(req.userId);

  const completed = rows.filter((r) => r.status === "completed").length;
  const inProgress = rows.filter((r) => r.status === "learning").length;
  const totalScore = rows.reduce((sum, r) => sum + r.best_score, 0);
  const avgScore = rows.length ? Math.round(totalScore / rows.length) : 0;

  const byTopic = TOPICS.map((t) => {
    const r = rows.find((row) => row.topic_id === t.id);
    return {
      id: t.id,
      name: t.name,
      color: t.color,
      status: r?.status || "not_started",
      bestScore: r?.best_score || 0,
      attempts: r?.attempts || 0
    };
  });

  res.json({
    totalTopics: TOPICS.length,
    completed,
    inProgress,
    avgScore,
    topics: byTopic
  });
});

router.post("/complete-tutorial", requireAuth, (req, res) => {
  db.prepare("UPDATE users SET tutorial_completed = 1 WHERE id = ?").run(req.userId);
  res.json({ ok: true });
});

export default router;
