# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

MindVault is a document Q&A system that allows users to upload PDF documents and ask questions about their content using retrieval-augmented generation (RAG). The system processes PDFs, creates embeddings for semantic search, and uses a local LLM to answer questions based on the most relevant document chunks.

## Architecture

This is a full-stack application with a clear separation between frontend and backend:

**Backend (Node.js/Express)**:
- `backend/src/server.js` - Main Express server entry point
- `backend/src/config/db.js` - MongoDB connection configuration
- `backend/src/models/chunkModel.js` - Mongoose model for storing document chunks with embeddings
- `backend/src/controllers/` - Request handlers for upload and query operations
- `backend/src/routes/` - API route definitions (`/api/upload`, `/api/query`)
- `backend/src/utils/` - Core utilities for PDF parsing, text chunking, and embeddings

**Frontend (React/Vite)**:
- `frontend/src/App.jsx` - Main React component (currently basic Vite template)
- Uses Vite for fast development and building

**Key Architecture Patterns**:
- **RAG Pipeline**: PDF upload → text extraction → chunking → embedding generation → vector storage → similarity search → LLM generation
- **Microservices Integration**: Integrates with local Ollama instance for both embeddings (`nomic-embed-text` model) and text generation (`mistral` model)
- **Document Processing**: Uses a chunking strategy with 500-word segments to manage context windows effectively

## Development Commands

### Backend Development
```bash
# Start backend development server (uses nodemon for auto-reload)
cd backend && npm run dev

# Install backend dependencies
cd backend && npm install
```

### Frontend Development
```bash
# Start frontend development server (Vite dev server with HMR)
cd frontend && npm run dev

# Build frontend for production
cd frontend && npm run build

# Preview production build
cd frontend && npm run preview

# Lint frontend code
cd frontend && npm run lint

# Install frontend dependencies
cd frontend && npm install
```

### Full Stack Development
```bash
# Start both frontend and backend (run in separate terminals)
cd backend && npm run dev &
cd frontend && npm run dev
```

## External Dependencies

**Required Services**:
- **MongoDB**: Local instance running on `mongodb://127.0.0.1:27017/MindVault`
- **Ollama**: Local LLM service running on `http://localhost:11434` with models:
  - `nomic-embed-text` (for generating embeddings)
  - `mistral` (for text generation)

**Start Required Services**:
```bash
# Start MongoDB (Ubuntu/Debian)
sudo systemctl start mongod

# Start Ollama and pull required models
ollama serve &
ollama pull nomic-embed-text
ollama pull mistral
```

## API Endpoints

- `POST /api/upload` - Upload PDF file for processing and indexing
- `POST /api/query` - Ask questions about uploaded documents

## Key Implementation Details

**PDF Processing Flow**:
1. File upload via multer to `uploads/` directory
2. PDF parsing using `pdf-parse` library
3. Text chunking into 500-word segments
4. Embedding generation for each chunk via Ollama API
5. Storage in MongoDB with metadata (fileName, pageNumber)

**Query Processing Flow**:
1. Generate embedding for user question
2. Calculate cosine similarity with all stored chunks
3. Retrieve top 3 most similar chunks
4. Send context + question to Ollama for answer generation
5. Handle both JSON and NDJSON streaming responses from Ollama

**Error Handling**:
- Comprehensive error handling for Ollama API responses (both JSON and streaming)
- Graceful fallbacks for missing documents or failed embeddings
- Detailed error messages for debugging

## Testing

Currently no test suite is configured. When adding tests:
- Use Jest for backend unit tests
- Consider Vitest for frontend tests (already available in Vite ecosystem)
- Test the RAG pipeline end-to-end with sample PDFs
- Mock Ollama API calls for unit tests

## Development Notes

- Backend uses ES modules (`"type": "module"` in package.json)
- PDF parsing uses CommonJS compatibility layer with `createRequire`
- Frontend is currently a basic Vite template - main application UI needs to be built
- CORS is enabled for cross-origin requests between frontend and backend
- File uploads are stored temporarily in `uploads/` directory
- Database connection is hardcoded - consider using environment variables for production