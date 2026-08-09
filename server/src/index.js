import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import topicsRoutes from "./routes/topics.js";
import contentRoutes from "./routes/content.js";
import quizRoutes from "./routes/quiz.js";
import progressRoutes from "./routes/progress.js";
import labRoutes from "./routes/lab.js";
import arenaRoutes from "./routes/arena.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import tutorRoutes from "./routes/tutor.js";
import reviewRoutes from "./routes/review.js";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/topics", topicsRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/lab", labRoutes);
app.use("/api/arena", arenaRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/tutor", tutorRoutes);
app.use("/api/review", reviewRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AI Quest 서버 실행 중: http://localhost:${PORT}`);
});
