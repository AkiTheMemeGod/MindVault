import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import uploadRoutes from "./routes/upload.js";
import queryRoutes from "./routes/query.js";
import authRoutes from "./routes/auth.js";
import studySessionRoutes from "./routes/studySession.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());


connectDB();

import File from './models/fileModel.js';

app.get('/api/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const fileDoc = await File.findOne({ filename });
    if (!fileDoc) return res.status(404).send('File not found');

    res.setHeader('Content-Type', fileDoc.contentType || 'application/pdf');
    res.setHeader('Content-Length', fileDoc.size || fileDoc.data.length);
    // CORS already allowed by app.use(cors())

    // Stream the buffer
    const stream = Buffer.from(fileDoc.data);
    res.send(stream);
  } catch (err) {
    console.error('File serve error:', err);
    res.status(500).send('Server error');
  }
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", studySessionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/query", queryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

import config from './config/index.js';

const PORT = config.port || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
