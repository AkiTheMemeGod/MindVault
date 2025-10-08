import express from "express";
import { 
  createStudySession, 
  getUserStudySessions, 
  getStudySession, 
  updateStudySession, 
  deleteStudySession,
  askQuestionInSession 
} from "../controllers/studySessionController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Study session management
router.post("/", createStudySession);
router.get("/", getUserStudySessions);
router.get("/:sessionId", getStudySession);
router.put("/:sessionId", updateStudySession);
router.delete("/:sessionId", deleteStudySession);

// Chat functionality
router.post("/:sessionId/ask", askQuestionInSession);

// Flashcards
import { generateFlashcards, generateQuiz, assessQuiz, listQuizzes } from "../controllers/studySessionController.js";
router.post("/:sessionId/flashcards/generate", generateFlashcards);

// Quizzes
router.post("/:sessionId/quiz/generate", generateQuiz);
router.post("/:sessionId/quiz/:quizId/assess", assessQuiz);
router.get("/:sessionId/quizzes", listQuizzes);

export default router;