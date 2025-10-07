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

export const askQuestion = async (req, res) => {
  try {
    const { question } = req.body || {};
    if (!question || typeof question !== "string") {
      return res.status(400).json({ error: "Question is required in request body" });
    }

    const questionEmbedding = await getEmbedding(question);

    const allChunks = await Chunk.find({});
    if (!allChunks || allChunks.length === 0) {
      return res.status(200).json({ answer: "No indexed documents available." });
    }

    allChunks.forEach(chunk => {
      chunk.similarity = cosineSimilarity(questionEmbedding, chunk.embedding);
    });

    const topChunks = allChunks.sort((a,b) => b.similarity - a.similarity).slice(0, 3);
    const contextText = topChunks.map(c => c.text).join("\n");

    const modelRes = await fetch(`${config.ollamaUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.ollamaModel,
        prompt: `You are a helpful study assistant.\nAnswer the question using only the context below.\n\nContext:\n${contextText}\n\nQuestion:\n${question}`
      }),
      // set a timeout via AbortController if desired
    });

    const contentType = modelRes.headers.get("content-type") || "";
    if (!modelRes.ok) {
      const text = await modelRes.text();
      return res.status(502).json({ error: `Model service error: ${modelRes.status} ${modelRes.statusText}`, details: text.slice(0, 200) });
    }

    // Two possibilities:
    // 1) The model returns a single JSON object with 'response' (application/json)
    // 2) The model streams newline-delimited JSON (NDJSON) where each line is a JSON object
    if (contentType.includes("application/json")) {
      const answerData = await modelRes.json();
      return res.json({ answer: answerData.response });
    }

    // If not application/json, try to parse as NDJSON or concatenated JSON lines
    const bodyText = await modelRes.text();
    // split by newlines and attempt to parse each line as JSON
    const lines = bodyText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let combined = "";
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj.response === 'string') {
          combined += obj.response;
        }
        // If 'done' flag present and true, we could break, but we'll continue to collect
      } catch (e) {
        // ignore parse errors for partial lines
      }
    }

    if (combined.length === 0) {
      // fallback: return raw text in details so frontend can show it
      return res.status(502).json({ error: "Model service returned non-JSON/empty streamed response", details: bodyText.slice(0, 200) });
    }

    return res.json({ answer: combined });
  } catch (err) {
    console.error("askQuestion error:", err);
    return res.status(500).json({ error: "Internal server error", details: err.message });
  }
};
