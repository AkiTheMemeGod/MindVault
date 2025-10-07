import pdfParser from "../utils/pdfParser.js";
import chunker from "../utils/chunker.js";
import getEmbedding from "../utils/embedding.js";
import Chunk from "../models/chunkModel.js";
import StudySession from "../models/studySessionModel.js";

export const uploadFile = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;
    
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Verify session belongs to user
    const session = await StudySession.findOne({ _id: sessionId, user: userId });
    if (!session) {
      return res.status(404).json({ error: "Study session not found" });
    }

    console.log(`Processing PDF: ${req.file.originalname}`);
    
    // Parse PDF and create chunks
    const text = await pdfParser(req.file.path);
    console.log(`PDF parsed, text length: ${text.length}`);
    
    const chunks = chunker(text, 500);
    console.log(`Created ${chunks.length} chunks`);

    // Process chunks in batches to avoid overwhelming the embedding API
    const batchSize = 5;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const chunkPromises = batch.map(async (chunkText, batchIndex) => {
        const globalIndex = i + batchIndex;
        const embedding = await getEmbedding(chunkText);
        return Chunk.create({
          text: chunkText,
          embedding,
          fileName: req.file.filename,
          originalName: req.file.originalname,
          pageNumber: Math.floor(globalIndex / 10) + 1, // Approximate page number
          sessionId: sessionId
        });
      });
      
      await Promise.all(chunkPromises);
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
    }

    // Add document to session
    session.documents.push({
      fileName: req.file.filename,
      originalName: req.file.originalname,
      uploadDate: new Date()
    });
    
    await session.save();
    console.log(`Upload complete: ${req.file.originalname}`);

    res.json({ 
      message: "PDF processed and embeddings stored successfully.",
      chunksCreated: chunks.length,
      fileName: req.file.originalname,
      success: true
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ 
      error: err.message,
      success: false
    });
  }
};
