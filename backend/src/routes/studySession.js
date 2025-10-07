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

export default router;