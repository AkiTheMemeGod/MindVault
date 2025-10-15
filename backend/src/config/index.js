// backend/src/config/index.js
import dotenv from 'dotenv';

dotenv.config("/home/theseus/Projects/MindVault/backend/.env");

const config = {
  mongoUri: process.env.MONGO_URI,
  port: process.env.PORT || 5000,
  jwt_secret: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ollamaUrl: process.env.OLLAMA_URL,
  ollamaModel: process.env.OLLAMA_MODEL,

  embeddingModel: process.env.EMBEDDING_MODEL,
};

export default config;