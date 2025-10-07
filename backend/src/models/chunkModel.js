import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema({
  text: String,
  embedding: [Number],
  fileName: String,
  originalName: String,
  pageNumber: Number,
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudySession',
    required: true
  }
}, {
  timestamps: true
});

const Chunk = mongoose.model("Chunk", chunkSchema);

export default Chunk;
