import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { askGemini } from "../utils/groq.js";
import db from "../db.js";

const router = Router();

// 프롬프트 실행
router.post("/run", requireAuth, async (req, res) => {
  const { systemPrompt, userPrompt, temperature } = req.body;
  if (!userPrompt || !userPrompt.trim()) {
    return res.status(400).json({ error: "프롬프트를 입력해 주세요." });
  }

  const fullPrompt = systemPrompt && systemPrompt.trim()
    ? `[시스템 지시사항]\n${systemPrompt.trim()}\n\n[사용자 입력]\n${userPrompt.trim()}`
    : userPrompt.trim();

  try {
    const startTime = Date.now();
    const tempValue = temperature !== undefined ? Number(temperature) : 0.7;
    const responseText = await askGemini(fullPrompt, { temperature: tempValue });
    const duration = Date.now() - startTime;

    res.json({
      output: responseText,
      durationMs: duration,
      tokenEstimate: Math.ceil((fullPrompt.length + responseText.length) / 3.5)
    });
  } catch (err) {
    console.error("Prompt Lab Run Error:", err);
    res.status(502).json({ error: "Groq AI 응답 생성에 실패했어요: " + err.message });
  }
});

// 저장된 프롬프트 템플릿 목록 조회
router.get("/templates", requireAuth, async (req, res) => {
  try {
    const templates = await db.all(
      "SELECT * FROM prompt_templates WHERE user_id = ? ORDER BY created_at DESC",
      [req.userId]
    );
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 새 프롬프트 템플릿 저장
router.post("/templates", requireAuth, async (req, res) => {
  const { title, systemPrompt, userPrompt, temperature } = req.body;
  if (!title || !userPrompt) {
    return res.status(400).json({ error: "제목과 프롬프트를 입력해 주세요." });
  }

  try {
    const result = await db.run(
      `INSERT INTO prompt_templates (user_id, title, system_prompt, user_prompt, temperature)
       VALUES (?, ?, ?, ?, ?)`,
      [req.userId, title, systemPrompt || "", userPrompt, temperature || 0.7]
    );
    const newTemplate = await db.get("SELECT * FROM prompt_templates WHERE id = ?", [
      result.lastInsertRowid
    ]);
    res.json({ template: newTemplate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 프롬프트 템플릿 삭제
router.delete("/templates/:id", requireAuth, async (req, res) => {
  try {
    await db.run("DELETE FROM prompt_templates WHERE id = ? AND user_id = ?", [
      req.params.id,
      req.userId
    ]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
