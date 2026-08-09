import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import db from "../db.js";

const router = Router();

// 오답 목록 조회
router.get("/", requireAuth, async (req, res) => {
  try {
    const list = await db.all(
      "SELECT * FROM wrong_answers WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );

    const parsedList = list.map((item) => ({
      ...item,
      options: JSON.parse(item.options_json || "[]")
    }));

    res.json({ wrongAnswers: parsedList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 오답 마스터(복습 완료) 처리
router.post("/master/:id", requireAuth, async (req, res) => {
  try {
    await db.run(
      "UPDATE wrong_answers SET mastered = 1 WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 오답 삭제
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    await db.run(
      "DELETE FROM wrong_answers WHERE id = ? AND user_id = ?",
      [req.params.id, req.userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
