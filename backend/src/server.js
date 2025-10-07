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

// Serve uploaded files with proper MIME types
app.use("/api/files", express.static(path.join(__dirname, "../uploads"), {
  setHeaders: (res, filePath) => {
    // All uploaded files are PDFs, so set the correct MIME type
    res.setHeader('Content-Type', 'application/pdf');
    // Enable CORS for file serving
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", studySessionRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/query", queryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
