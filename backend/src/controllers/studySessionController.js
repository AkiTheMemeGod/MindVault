import StudySession from "../models/studySessionModel.js";
import Chunk from "../models/chunkModel.js";
import getEmbedding from "../utils/embedding.js";
import fetch from "node-fetch";
import config from '../config/index.js';

function cosineSimilarity(a, b) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (normA * normB);
}

export const createStudySession = async (req, res) => {
  try {
    const { title, description } = req.body;
    const userId = req.user._id;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const studySession = new StudySession({
      title,
      description: description || "",
      user: userId
    });

    await studySession.save();

    res.status(201).json({
      message: "Study session created successfully",
      session: studySession
    });
  } catch (error) {
    console.error("Create study session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Generate flashcards based on session documents and recent messages
// Helper to extract JSON object from an LLM response string that may include code fences
function extractJsonObject(str) {
  if (!str || typeof str !== 'string') return null;
  // Remove code fences like ```json ... ``` or ``` ... ```
  str = str.replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, ''));
  str = str.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  // Find first '{' and last '}' to get a JSON object
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonSlice = str.slice(start, end + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch (e) {
    return null;
  }
}

// Attempt to sanitize minor JSON issues: trailing commas and single-quoted strings
function sanitizeJsonCandidate(str) {
  if (!str || typeof str !== 'string') return str;
  let s = str.trim();
  // Remove code fences
  s = s.replace(/```json[\s\S]*?```/gi, (m) => m.replace(/```json|```/gi, ''));
  s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ''));
  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, '$1');
  // Replace single-quoted strings with double-quoted (naive)
  // This is a best-effort; proper JSON should already use double quotes
  s = s.replace(/'([^'\\]*)'/g, '"$1"');
  return s;
}

export const generateFlashcards = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return res.status(404).json({ error: "Study session not found" });
    }

    // Collect context from top chunks similar to last few messages or all documents
    const sessionDocuments = session.documents.map(doc => doc.fileName);
    const allChunks = await Chunk.find({ fileName: { $in: sessionDocuments } }).limit(100);

    if (!allChunks || allChunks.length === 0) {
      return res.status(400).json({ error: "No documents found in this session. Please upload documents first." });
    }

    // If last user message exists, bias selection by similarity
    let contextText = '';
    const lastUserMsg = [...session.messages].reverse().find(m => m.type === 'user');
    if (lastUserMsg) {
      const qEmb = await getEmbedding(lastUserMsg.content);
      allChunks.forEach(chunk => {
        chunk.similarity = cosineSimilarity(qEmb, chunk.embedding);
      });
      const top = allChunks.sort((a,b)=>b.similarity-a.similarity).slice(0, 10);
      contextText = top.map(c => c.text).join("\n");
    } else {
      contextText = allChunks.slice(0, 10).map(c => c.text).join("\n");
    }

    const prompt = `You are an expert study assistant.
Important: Respond with ONLY JSON, no code fences and no prose. Use double quotes, no trailing commas.
Create concise flashcards given STUDY_CONTEXT.
Strict schema: { "flashcards": [ { "front": string, "back": string } ] }
Return a JSON object { "flashcards": [ { "front": string, "back": string }... ] }.
- front: a short question or key term.
- back: a clear answer or definition, 1-3 sentences.
- 8 to 12 flashcards total.
- Use only the context. If insufficient, say so in one card.

STUDY_CONTEXT:\n${contextText}`;

    const modelRes = await fetch(`${config.ollamaUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.ollamaModel, prompt, stream: false, format: "json" })
    });

    if (!modelRes.ok) {
      const text = await modelRes.text();
      return res.status(502).json({ error: `AI service error: ${modelRes.status} ${modelRes.statusText}`, details: text.slice(0,200) });
    }

    const contentType = modelRes.headers.get('content-type') || '';

    let raw = '';
    if (contentType.includes('application/json')) {
      const data = await modelRes.json();
      raw = typeof data?.response === 'string' ? data.response : '';
    } else {
      // NDJSON text stream
      const text = await modelRes.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj?.response) raw += obj.response;
        } catch {
          // ignore
        }
      }
    }

    // Try direct JSON parse first
    let parsed = null;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : null;
    } catch {}
    if (!parsed) {
      try { parsed = JSON.parse(sanitizeJsonCandidate(raw)); } catch {}
    }
    if (!parsed) parsed = extractJsonObject(raw);
    if (!parsed) {
      const cleaned = sanitizeJsonCandidate(raw);
      parsed = extractJsonObject(cleaned);
    }

    // Fallback: sometimes the API returns structured object directly
    if (!parsed || typeof parsed !== 'object') {
      // Try to see if the entire response was already an object
      // No-op here as we only have string raw; keep as null
    }

    if (!parsed) {
      return res.status(502).json({ error: "Failed to parse AI flashcards JSON" });
    }

    const candidates = parsed.flashcards || parsed.cards || parsed.items || [];
    const flashcards = Array.isArray(candidates) ? candidates.filter(fc => fc && fc.front && fc.back) : [];
    if (flashcards.length === 0) {
      return res.status(502).json({ error: "AI returned no flashcards" });
    }

    res.json({ flashcards });
  } catch (error) {
    console.error("Generate flashcards error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

import Quiz from "../models/quizModel.js";

// Generate quiz questions
export const generateQuiz = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { count } = req.body;
    const userId = req.user._id;

    const n = Math.max(1, Math.min(50, parseInt(count || '5', 10)));

    const session = await StudySession.findOne({ _id: sessionId, user: userId });
    if (!session) return res.status(404).json({ error: "Study session not found" });

    const sessionDocuments = session.documents.map(doc => doc.fileName);
    const allChunks = await Chunk.find({ fileName: { $in: sessionDocuments } }).limit(150);
    if (!allChunks || allChunks.length === 0) {
      return res.status(400).json({ error: "No documents found in this session. Please upload documents first." });
    }

    const contextText = allChunks.slice(0, 20).map(c => c.text).join("\n");

    const prompt = `You are an expert quiz generator.
Important: Respond with ONLY JSON, no code fences and no prose. Use double quotes, no trailing commas.
From the STUDY_CONTEXT below, generate ${n} multiple-choice questions in strict JSON format.
Strict schema: { "questions": [ { "question": string, "options": [string, string, string, string], "correctIndex": number } ] }
Return an object { "questions": [ { "question": string, "options": [string, string, string, string], "correctIndex": number } ] }.
Rules:
- Options length must be 4. Only one correct.
- The correctIndex is 0..3.
- Use only the given context. Keep questions clear and unambiguous.
- Avoid trivia not present in context.
STUDY_CONTEXT:\n${contextText}`;

    const modelRes = await fetch(`${config.ollamaUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.ollamaModel, prompt, stream: false, format: "json" })
    });

    if (!modelRes.ok) {
      const text = await modelRes.text();
      return res.status(502).json({ error: `AI service error: ${modelRes.status} ${modelRes.statusText}`, details: text.slice(0,200) });
    }
    const contentType = modelRes.headers.get('content-type') || '';

    let raw = '';
    if (contentType.includes('application/json')) {
      const data = await modelRes.json();
    
      raw = typeof data?.response === 'string' ? data.response : '';
    } else {
      const text = await modelRes.text();
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj?.response) raw += obj.response;
        } catch { }
      }
    }

    // Try direct JSON parse first
    let parsed = null;
    try {
      parsed = typeof raw === 'string' ? JSON.parse(raw) : null;
    } catch {}
    if (!parsed) {
      try { parsed = JSON.parse(sanitizeJsonCandidate(raw)); } catch {}
    }
    if (!parsed) parsed = extractJsonObject(raw);
    if (!parsed) {
      const cleaned = sanitizeJsonCandidate(raw);
      parsed = extractJsonObject(cleaned);
    }

    if (!parsed) {
      return res.status(502).json({ error: "Failed to parse AI quiz JSON" });
    }

    const qArr = parsed.questions || parsed.quiz || parsed.items || [];
    const questions = Array.isArray(qArr) ? qArr.filter(q => q && q.question && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.correctIndex)) : [];
    if (questions.length === 0) return res.status(502).json({ error: "AI returned no valid questions" });

    // Create quiz in DB
    const quiz = await Quiz.create({ sessionId, user: userId, questions });

    res.json({ quizId: quiz._id, questions: quiz.questions });
  } catch (error) {
    console.error("Generate quiz error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const assessQuiz = async (req, res) => {
  try {
    const { sessionId, quizId } = req.params;
    const { answers } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(answers)) return res.status(400).json({ error: "answers must be an array of indices" });

    const quiz = await Quiz.findOne({ _id: quizId, sessionId, user: userId });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score += 1;
    });

    const attempt = { answers, score, createdAt: new Date() };
    quiz.attempts.push(attempt);
    quiz.lastAttemptAt = new Date();
    await quiz.save();

    res.json({ score, total: quiz.questions.length, correctAnswers: quiz.questions.map(q => q.correctIndex) });
  } catch (error) {
    console.error("Assess quiz error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const listQuizzes = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const quizzes = await Quiz.find({ sessionId, user: userId })
      .select('createdAt lastAttemptAt attempts questions')
      .sort({ createdAt: -1 });

    // Map to summary with latest score if any
    const items = quizzes.map(q => {
      const lastAttempt = q.attempts?.[q.attempts.length - 1];
      return {
        id: q._id,
        createdAt: q.createdAt,
        lastAttemptAt: q.lastAttemptAt,
        totalQuestions: q.questions.length,
        lastScore: lastAttempt ? lastAttempt.score : null
      };
    });

    res.json({ quizzes: items });
  } catch (error) {
    console.error("List quizzes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserStudySessions = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sessions = await StudySession.find({ user: userId })
      .select("title description status lastActivity totalMessages documents createdAt")
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(limit);

    const total = await StudySession.countDocuments({ user: userId });

    res.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get study sessions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findOne({ 
      _id: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ error: "Study session not found" });
    }

    res.json({ session });
  } catch (error) {
    console.error("Get study session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStudySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, description, status } = req.body;
    const userId = req.user._id;

    const session = await StudySession.findOneAndUpdate(
      { _id: sessionId, user: userId },
      { title, description, status },
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ error: "Study session not found" });
    }

    res.json({
      message: "Study session updated successfully",
      session
    });
  } catch (error) {
    console.error("Update study session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteStudySession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    const session = await StudySession.findOneAndDelete({ 
      _id: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ error: "Study session not found" });
    }

    // Also delete associated chunks for this session
    await Chunk.deleteMany({ sessionId });

    res.json({ message: "Study session deleted successfully" });
  } catch (error) {
    console.error("Delete study session error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const askQuestionInSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { question } = req.body;
    const userId = req.user._id;

    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required" });
    }

    const session = await StudySession.findOne({ 
      _id: sessionId, 
      user: userId 
    });

    if (!session) {
      return res.status(404).json({ error: "Study session not found" });
    }

    // Generate embedding for the question
    const questionEmbedding = await getEmbedding(question);

    // Find relevant chunks from documents in this session
    const sessionDocuments = session.documents.map(doc => doc.fileName);
    const allChunks = await Chunk.find({ 
      fileName: { $in: sessionDocuments }
    });

    if (!allChunks || allChunks.length === 0) {
      return res.status(400).json({ 
        error: "No documents found in this session. Please upload documents first." 
      });
    }

    // Calculate similarity and get top chunks
    allChunks.forEach(chunk => {
      chunk.similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
    });

    const topChunks = allChunks.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
    const contextText = topChunks.map(c => c.text).join("\n");

    // Enhanced prompt for study assistant
    const studyPrompt = `You are an intelligent study assistant helping a student understand their study material. Your role is to:
1. Answer questions clearly and concisely
2. Help the student learn by explaining concepts step-by-step
3. Ask follow-up questions to test understanding
4. Provide examples when helpful
5. Encourage critical thinking

Based on the context below, answer the student's question. If the context doesn't contain enough information, say so and suggest what additional information might be helpful.

Context:
${contextText}

Student's Question:
${question}

Provide a helpful, educational response:`;

    // Call Ollama for response
    const modelRes = await fetch(`${config.ollamaUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.ollamaModel,
        prompt: studyPrompt
      }),
    });

    const contentType = modelRes.headers.get("content-type") || "";
    if (!modelRes.ok) {
      const text = await modelRes.text();
      return res.status(502).json({ 
        error: `AI service error: ${modelRes.status} ${modelRes.statusText}`, 
        details: text.slice(0, 200) 
      });
    }

    let answerText = "";

    if (contentType.includes("application/json")) {
      const answerData = await modelRes.json();
      answerText = answerData.response;
    } else {
      // Handle NDJSON response
      const bodyText = await modelRes.text();
      const lines = bodyText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj && typeof obj.response === 'string') {
            answerText += obj.response;
          }
        } catch (e) {
          // ignore parse errors for partial lines
        }
      }
    }

    if (!answerText) {
      return res.status(502).json({ error: "AI service returned empty response" });
    }

    // Add messages to session
    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date()
    };

    const assistantMessage = {
      type: 'assistant',
      content: answerText,
      timestamp: new Date(),
      sources: topChunks.map(chunk => ({
        fileName: chunk.fileName,
        pageNumber: chunk.pageNumber,
        text: chunk.text.substring(0, 200) + "...",
        similarity: chunk.similarity
      }))
    };

    session.messages.push(userMessage, assistantMessage);
    await session.save();

    res.json({
      answer: answerText,
      sources: assistantMessage.sources,
      messageId: assistantMessage._id
    });
  } catch (error) {
    console.error("Ask question error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};