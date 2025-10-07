import StudySession from "../models/studySessionModel.js";
import Chunk from "../models/chunkModel.js";
import getEmbedding from "../utils/embedding.js";
import fetch from "node-fetch";

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
    const modelRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "mistral",
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