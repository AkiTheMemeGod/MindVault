import fetch from "node-fetch";
import config from '../config/index.js';

export default async function getEmbedding(text) {
  const endpoint = `${config.ollamaUrl}/embeddings`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.embeddingModel,
      prompt: text
    })
  });

  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Embedding service error: ${res.status} ${res.statusText} - ${body.slice(0,200)}`);
  }

  if (!contentType.includes("application/json")) {
    const body = await res.text();
    throw new Error(`Embedding service returned non-JSON response: ${body.slice(0,200)}`);
  }

  const data = await res.json();
  if (!data || !data.embedding) throw new Error("Embedding service returned invalid payload");
  return data.embedding;
}
