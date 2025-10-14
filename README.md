# MindVault

MindVault is a beautiful, full‑stack document Q&A system that lets users upload PDF documents and ask natural language questions about their contents. It combines PDF parsing, semantic chunking, vector embeddings, and a local LLM for retrieval‑augmented generation (RAG) so answers are grounded in your documents.

Features
- Upload PDF files and automatically extract and index their text
- Chunking strategy to keep context windows manageable
- Embeddings for semantic search using a local embedding model
- Retrieval of the most relevant document chunks and answer generation with a local LLM
- Minimal, modern React frontend (Vite) and small Express backend

Demo Screenshots
Add screenshots in `frontend/public` and reference them here to show the UI and PDF viewer.

Why MindVault?
- Great for knowledge workers who want instant answers from internal documents
- Designed for local-first development with Ollama and MongoDB
- Small codebase that's easy to understand, extend, and demo

## Project Structure

Top-level layout (only most relevant files shown):

```
frontend/       # React + Vite UI
backend/        # Node.js + Express API and processing pipeline
WARP.md         # Project guidance and local dev notes
README.md       # This file
```

Backend highlights (`backend/src`)
- `server.js` — Express server entry
- `config/db.js` — MongoDB connection
- `routes/` — API route definitions: `upload`, `query`, `auth`, `studySession`
- `controllers/` — Request handlers for upload, query, and other actions
- `utils/` — PDF parsing, chunking, and embedding helpers

Frontend highlights (`frontend/src`)
- `App.jsx`, `main.jsx` — React app entry
- `components/PDFViewer.jsx` — Lightweight PDF viewing UI
- `pages/StudySession.jsx` — Core page for asking questions about documents

## Architecture Overview

1. Upload PDF → stored in `uploads/` and parsed with `pdf-parse`
2. Text is chunked (configurable chunk size) to keep context manageable
3. Each chunk is converted to an embedding via a local embedding model (Ollama `nomic-embed-text`)
4. Chunks + embeddings saved in MongoDB via Mongoose models
5. On user query: embed the question, compute cosine similarity, pick top N chunks, and send context + question to LLM (Ollama `mistral`) to generate an answer

This design keeps the retrieval step simple and effective while letting the LLM produce concise, grounded answers.

## Quick Start (Local Development)

Prerequisites
- Node.js (v16+ recommended)
- npm or pnpm
- MongoDB running locally at `mongodb://127.0.0.1:27017/MindVault`
- Ollama running at `http://localhost:11434` with models:
  - `nomic-embed-text` (embeddings)
  - `mistral` (generation)

Start services and apps

1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

2. Start backend (development)

```bash
cd backend
npm run dev
```

3. Start frontend (Vite)

```bash
cd frontend
npm run dev
```

4. Open your browser and go to the Vite dev URL (usually `http://localhost:5173`)

Notes
- The backend expects Ollama and MongoDB to be reachable. See `WARP.md` for exact commands to start these services.

## API Endpoints

- POST /api/upload — Upload a PDF to be processed and indexed. Multipart form data with file field `file`.
- POST /api/query — Ask a question about indexed documents. JSON body with `question` and optional `fileId` or `context` filters.

See `backend/src/routes` and `backend/src/controllers` for exact request shapes and additional endpoints like auth and study session management.

## Configuration & Environment

- The backend uses environment variables in `backend/.env` to configure MongoDB, JWT secrets, and other settings. Review and update `backend/.env` before running in production.

## Development Notes

- The RAG pipeline is intentionally small and synchronous for clarity. If you scale this app, consider:
  - Moving embedding generation to a background job queue
  - Using a dedicated vector DB (e.g., Pinecone, Milvus) for large datasets
  - Adding rate limiting and stricter auth for public deployments

## Contributing

Contributions are welcome! If you'd like to help:

1. Fork the repo
2. Create a topic branch (feature/bugfix)
3. Open a PR with a clear description and small, focused changes

Please add tests for new behavior. Backend unit tests are not included yet — adding Jest unit tests for the RAG pipeline would be a great first contribution.

## License

This repository does not include a license file. Add a license (MIT, Apache, etc.) if you plan to publish the code.

## Acknowledgements

- Built with love and curiosity. Thanks to the authors of Ollama, pdf-parse, Vite, and Mongoose.

---

If you want a fancier README (badges, CI status, animated GIF demo, or specific screenshots inserted), tell me which images or badges you want and I’ll update the file.
