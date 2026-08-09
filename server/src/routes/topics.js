import { Router } from "express";
import { TOPICS } from "../data/topics.js";
import { requireAuth } from "../middleware/auth.js";
import db from "../db.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const rows = await db.all(
    "SELECT topic_id, status, best_score FROM progress WHERE user_id = ?",
    [req.userId]
  );
  const progressMap = Object.fromEntries(rows.map((r) => [r.topic_id, r]));

  const topics = TOPICS.map((t) => ({
    ...t,
    status: progressMap[t.id]?.status || "not_started",
    bestScore: progressMap[t.id]?.best_score || 0
  }));

  res.json({ topics });
});

export default router;
