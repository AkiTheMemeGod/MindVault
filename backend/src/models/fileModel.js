import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  filename: { type: String, required: true, unique: true },
  originalName: String,
  contentType: String,
  size: Number,
  data: Buffer,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession' },
}, {
  timestamps: true
});

const File = mongoose.model('File', fileSchema);
export default File;
