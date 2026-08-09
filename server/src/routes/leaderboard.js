import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import db from "../db.js";

const router = Router();

// 리더보드 순위표 조회
router.get("/", requireAuth, async (req, res) => {
  try {
    const users = await db.all("SELECT id, name, email FROM users");

    const leaderboard = await Promise.all(
      users.map(async (u) => {
        // 학습 진도 & 퀴즈 최고 점수
        const progressList = await db.all(
          "SELECT best_score, status FROM progress WHERE user_id = ?",
          [u.id]
        );

        const completedCount = progressList.filter((p) => p.status === "completed").length;
        const quizTotalScore = progressList.reduce((acc, p) => acc + (p.best_score || 0), 0);

        // 아레나 최고 점수
        const arenaMax = await db.get(
          "SELECT MAX(score) as max_score FROM arena_records WHERE user_id = ?",
          [u.id]
        );
        const arenaBest = arenaMax?.max_score || 0;

        // 추가 기록 (뱃지 판단용)
        const wrongRow = await db.get(
          "SELECT COUNT(*) as cnt FROM wrong_answers WHERE user_id = ?",
          [u.id]
        );
        const masteredRow = await db.get(
          "SELECT COUNT(*) as cnt FROM wrong_answers WHERE user_id = ? AND mastered = 1",
          [u.id]
        );
        const promptRow = await db.get(
          "SELECT COUNT(*) as cnt FROM prompt_templates WHERE user_id = ?",
          [u.id]
        );

        const wrongCount = wrongRow?.cnt || 0;
        const masteredCount = masteredRow?.cnt || 0;
        const promptCount = promptRow?.cnt || 0;

        // 종합 점수 = 퀴즈 최고 점수 합산 + (완료 모듈 수 * 300) + 아레나 최고 점수 + (마스터한 오답 * 50)
        const grandTotal = quizTotalScore + completedCount * 300 + arenaBest + masteredCount * 50;

        return {
          id: u.id,
          name: u.name,
          completedCount,
          quizTotalScore,
          arenaBest,
          wrongCount,
          masteredCount,
          promptCount,
          grandTotal
        };
      })
    );

    // 종합 점수 순 정렬
    leaderboard.sort((a, b) => b.grandTotal - a.grandTotal);

    // 랭킹 등수 매기기
    const rankedList = leaderboard.map((item, idx) => ({
      rank: idx + 1,
      ...item
    }));

    const myRankItem = rankedList.find((item) => item.id === req.userId) || null;

    res.json({
      leaderboard: rankedList.slice(0, 20), // 상위 20명
      myRank: myRankItem
    });
  } catch (err) {
    console.error("Leaderboard Error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
