import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import OAuthCallback from "./pages/OAuthCallback.jsx";
import Welcome from "./pages/Welcome.jsx";
import Home from "./pages/Home.jsx";
import Learn from "./pages/Learn.jsx";
import Quiz from "./pages/Quiz.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PromptLab from "./pages/PromptLab.jsx";
import QuizArena from "./pages/QuizArena.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import AITutor from "./pages/AITutor.jsx";
import Review from "./pages/Review.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route path="/welcome" element={
        <ProtectedRoute><Welcome /></ProtectedRoute>
      } />
      <Route path="/" element={
        <ProtectedRoute><Home /></ProtectedRoute>
      } />
      <Route path="/learn/:topicId" element={
        <ProtectedRoute><Learn /></ProtectedRoute>
      } />
      <Route path="/quiz/:topicId" element={
        <ProtectedRoute><Quiz /></ProtectedRoute>
      } />
      <Route path="/lab" element={
        <ProtectedRoute><PromptLab /></ProtectedRoute>
      } />
      <Route path="/arena" element={
        <ProtectedRoute><QuizArena /></ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute><Leaderboard /></ProtectedRoute>
      } />
      <Route path="/tutor" element={
        <ProtectedRoute><AITutor /></ProtectedRoute>
      } />
      <Route path="/review" element={
        <ProtectedRoute><Review /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
