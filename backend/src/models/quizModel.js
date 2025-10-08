import mongoose from "mongoose";

const quizQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  sources: [{
    fileName: String,
    pageNumber: Number,
    text: String,
    similarity: Number
  }]
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  answers: [{ type: Number, required: true }],
  score: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const quizSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [quizQuestionSchema],
  createdAt: { type: Date, default: Date.now },
  lastAttemptAt: { type: Date, default: null },
  attempts: [quizAttemptSchema]
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;